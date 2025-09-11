import { useState, useEffect, useRef } from "react"; // 1. Importar useRef
import { useParams, NavLink } from "react-router-dom";
import { ChevronLeft, Plus, Search, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DateRange } from "react-day-picker";
import { format, isWithinInterval, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

// --- TIPAGEM E DADOS ---

type Servico = {
  id: number;
  data: string | null;
  os: string;
  cliente: string;
  operador: string;
  n_fiscal: string;
  boleto: string;
  vencimento: string | null;
  valor_bruto: number;
  data_pagamento: string | null;
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';
  placa_veiculo: string;
};

type Despesa = {
    id: number;
    data: string | null;
    fornecedor: string;
    descricao: string;
    vencimento: string | null;
    valor_total: number;
    placa_veiculo: string;
};

const statusOptions: Servico['status'][] = ['Pendente', 'Pago', 'Vencido', 'Cancelado'];

const parseDateStringAsLocal = (dateString: string | null | Date): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const date = new Date(`${dateString}T00:00:00`);
    return isValid(date) ? date : null;
}

// --- COMPONENTE DE CÉLULA EDITÁVEL ---
type EditableCellProps = {
  value: string | number | Date | null; isEditing: boolean; onToggleEditing: (isEditing: boolean) => void; onSave: (value: any) => void; type?: 'text' | 'number' | 'date' | 'select'; options?: string[];
};
const EditableCell = ({ value: initialValue, onSave, isEditing, onToggleEditing, type = 'text', options = [] }: EditableCellProps) => {
    const [value, setValue] = useState(initialValue);
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    const handleSave = () => { onSave(value); onToggleEditing(false); };
    const handleCancel = () => { setValue(initialValue); onToggleEditing(false); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); };
    if (isEditing) {
        const currentDate = parseDateStringAsLocal(value);
        switch (type) {
            case 'date': 
                return ( 
                    <Popover open onOpenChange={(isOpen) => !isOpen && handleSave()}> 
                        <PopoverTrigger asChild> 
                            <Button variant="outline" className="h-8 w-full justify-start font-normal text-xs md:text-sm">
                                <span>{currentDate ? format(currentDate, "dd/MM/yyyy") : "Selecione..."}</span>
                            </Button> 
                        </PopoverTrigger> 
                        <PopoverContent className="w-auto p-0"> 
                            <Calendar mode="single" selected={currentDate || undefined} onSelect={(date) => date && setValue(date)} initialFocus /> 
                        </PopoverContent> 
                    </Popover> 
                );
            case 'select': return ( <Select value={value as string} onValueChange={(newValue) => onSave(newValue)}> <SelectTrigger className="h-8 text-xs md:text-sm"> <SelectValue placeholder="Selecione..." /> </SelectTrigger> <SelectContent> {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)} </SelectContent> </Select> );
            case 'number': return ( <Input type="number" value={value as number} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8 text-xs md:text-sm"/> );
            default: return ( <Input value={value as string} onChange={(e) => setValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8 text-xs md:text-sm"/> );
        }
    }
    let displayValue: React.ReactNode = value;
    if (type === 'date' && value) { const date = parseDateStringAsLocal(value); displayValue = date ? format(date, "dd/MM/yyyy") : '-'; } 
    else if (typeof value === 'number') { displayValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    return ( <div onClick={() => onToggleEditing(true)} className="cursor-pointer min-h-[2rem] flex items-center p-2 -m-2"> {displayValue || '-'} </div> );
};

// --- COMPONENTE PRINCIPAL ---
const VeiculoDetalhes = () => {
  const { placa: placaFromUrl } = useParams<{ placa: string }>();
  const placa = placaFromUrl?.toUpperCase();

  const [searchTerm, setSearchTerm] = useState("");
  const [servicos, setServicos] = useState<Partial<Servico>[]>([]);
  const [despesas, setDespesas] = useState<Partial<Despesa>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ table: 'servicos' | 'despesas'; rowIndex: number; columnId: string } | null>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  // 2. Criar as referências para os contentores das tabelas
  const servicosContentRef = useRef<HTMLDivElement>(null);
  const despesasContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!placa) return;
      setLoading(true);
      setError(null);
      const [servicosResponse, despesasResponse] = await Promise.all([
        supabase.from('servicos').select('*').eq('placa_veiculo', placa).order('data', { ascending: false }),
        supabase.from('despesas').select('*').eq('placa_veiculo', placa).order('data', { ascending: false })
      ]);
      if (servicosResponse.error || despesasResponse.error) {
        console.error('Erro ao buscar detalhes:', servicosResponse.error || despesasResponse.error);
        setError('Não foi possível carregar os detalhes do veículo.');
      } else {
        setServicos(servicosResponse.data || []);
        setDespesas(despesasResponse.data || []);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [placa]);

  const filterByDateAndTerm = (items: (Partial<Servico> | Partial<Despesa>)[]) => {
      return items.filter(item => {
          const searchTermMatch = 'cliente' in item ?
            ((item.os || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())) :
            ((item.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()));
          
          const itemDate = parseDateStringAsLocal(item.data || null);
          if (!itemDate) return true;
          
          const dateMatch = date?.from && date?.to ? isWithinInterval(itemDate, { start: date.from, end: date.to }) : true;
          return searchTermMatch && dateMatch;
      });
  }
  const filteredServicos = filterByDateAndTerm(servicos);
  const filteredDespesas = filterByDateAndTerm(despesas);

  const handleSave = async (table: 'servicos' | 'despesas', rowIndex: number, columnId: string, value: any) => {
    setEditingCell(null);
    const recordList = table === 'servicos' ? servicos : despesas;
    const setRecordList = table === 'servicos' ? setServicos : setDespesas;
    const record = recordList[rowIndex];
    const updatedValue = value instanceof Date ? format(value, 'yyyy-MM-dd') : value;
    const updatedRecords = [...recordList];
    updatedRecords[rowIndex] = { ...record, [columnId]: updatedValue };
    setRecordList(updatedRecords);
    if (!record.id) {
      const recordToInsert = { ...updatedRecords[rowIndex], placa_veiculo: placa };
      const { data, error } = await supabase.from(table).insert(recordToInsert).select().single();
      if (error) {
        console.error(`Erro ao inserir ${table}:`, error);
        setError(`Falha ao salvar. Por favor, tente novamente.`);
        setRecordList(recordList.filter((_, idx) => idx !== rowIndex));
      } else {
        const finalRecords = [...recordList];
        finalRecords[rowIndex] = data;
        setRecordList(finalRecords);
      }
    } else {
      const { error } = await supabase.from(table).update({ [columnId]: updatedValue }).eq('id', record.id);
      if (error) {
        console.error(`Erro ao atualizar ${table}:`, error);
        setError(`Falha ao salvar. Por favor, tente novamente.`);
        setRecordList(recordList);
      }
    }
  };

  const handleAddRow = (table: 'servicos' | 'despesas') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (table === 'servicos') {
        const newServico: Partial<Servico> = { data: today, os: '', cliente: '', operador: '', n_fiscal: '', boleto: '', vencimento: today, valor_bruto: 0, data_pagamento: null, status: 'Pendente' };
        setServicos(prev => {
            const newIndex = prev.length;
            // 3. Efeito secundário para scroll e foco
            setTimeout(() => {
                servicosContentRef.current?.scrollTo({ top: servicosContentRef.current.scrollHeight, behavior: 'smooth' });
                setEditingCell({ table: 'servicos', rowIndex: newIndex, columnId: 'data' });
            }, 100);
            return [...prev, newServico];
        });
    } else {
        const newDespesa: Partial<Despesa> = { data: today, fornecedor: '', descricao: '', vencimento: today, valor_total: 0 };
        setDespesas(prev => {
            const newIndex = prev.length;
            setTimeout(() => {
                despesasContentRef.current?.scrollTo({ top: despesasContentRef.current.scrollHeight, behavior: 'smooth' });
                setEditingCell({ table: 'despesas', rowIndex: newIndex, columnId: 'data' });
            }, 100);
            return [...prev, newDespesa];
        });
    }
  };

  const handleDelete = async (table: 'servicos' | 'despesas', id: number) => {
    const recordList = table === 'servicos' ? servicos : despesas;
    const setRecordList = table === 'servicos' ? setServicos : setDespesas;
    setRecordList(recordList.filter(record => record.id !== id));
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        console.error(`Erro ao excluir ${table}:`, error);
        setError('Falha ao excluir. Por favor, recarregue a página.');
    }
  };
  
  if (loading) return <p>A carregar detalhes do veículo...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-4">
      <NavLink to="/veiculos" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
      </NavLink>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes do Veículo: {placa}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>) : (format(date.from, "dd/MM/yy"))) : (<span>Selecione o período</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1  gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Serviços Realizados</CardTitle>
            <Button size="sm" onClick={() => handleAddRow('servicos')}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Serviço
            </Button>
          </CardHeader>
          {/* 4. Atribuir a ref ao contentor */}
          <CardContent className="overflow-x-auto" ref={servicosContentRef}>
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="min-w-[120px]">Data</TableHead>
                    <TableHead className="min-w-[150px]">O.S</TableHead> 
                    <TableHead className="min-w-[180px]">Cliente</TableHead>
                    <TableHead className="min-w-[150px]">Operador</TableHead>
                    <TableHead className="min-w-[100px]">N° Fiscal</TableHead>
                    <TableHead className="min-w-[100px]">Boleto</TableHead>
                    <TableHead className="min-w-[120px]">Vencimento</TableHead>
                    <TableHead className="min-w-[130px]">Valor Bruto</TableHead>
                    <TableHead className="min-w-[120px]">Data Pagto.</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicos.map((servico, rowIndex) => (
                  <TableRow key={servico.id || `new-${rowIndex}`}>
                    <TableCell><EditableCell type="date" value={servico.data} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'data' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'data', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.os} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'os'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'os' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'os', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.cliente} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'cliente'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'cliente' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'cliente', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.operador} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'operador'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'operador' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'operador', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.n_fiscal} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'n_fiscal'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'n_fiscal' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'n_fiscal', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.boleto} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'boleto'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'boleto' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'boleto', value)}/></TableCell>
                    <TableCell><EditableCell type="date" value={servico.vencimento} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'vencimento'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'vencimento' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'vencimento', value)}/></TableCell>
                    <TableCell><EditableCell type="number" value={servico.valor_bruto} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'valor_bruto'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'valor_bruto' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'valor_bruto', value)}/></TableCell>
                    <TableCell><EditableCell type="date" value={servico.data_pagamento} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data_pagamento'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'data_pagamento' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'data_pagamento', value)}/></TableCell>
                    <TableCell><EditableCell type="select" options={statusOptions} value={servico.status} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'status'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'status' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'status', value)}/></TableCell>
                    <TableCell>
                      {servico.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isto irá excluir permanentemente o serviço.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete('servicos', servico.id!)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manutenção / Despesas</CardTitle>
            <Button size="sm" onClick={() => handleAddRow('despesas')}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Despesa
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto" ref={despesasContentRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Data</TableHead>
                  <TableHead className="min-w-[180px]">Fornecedor</TableHead>
                  <TableHead className="min-w-[200px]">Descrição</TableHead>
                  <TableHead className="min-w-[120px]">Vencimento</TableHead>
                  <TableHead className="min-w-[130px]">Valor Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredDespesas.map((despesa, rowIndex) => (
                  <TableRow key={despesa.id || `new-${rowIndex}`}>
                    <TableCell><EditableCell type="date" value={despesa.data} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'data' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'data', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={despesa.fornecedor} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'fornecedor'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'fornecedor' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'fornecedor', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={despesa.descricao} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'descricao'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'descricao' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'descricao', value)}/></TableCell>
                    <TableCell><EditableCell type="date" value={despesa.vencimento} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'vencimento'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'vencimento' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'vencimento', value)}/></TableCell>
                    <TableCell><EditableCell type="number" value={despesa.valor_total} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'valor_total'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'valor_total' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'valor_total', value)}/></TableCell>
                    <TableCell>
                      {despesa.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isto irá excluir permanentemente a despesa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete('despesas', despesa.id!)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                 ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VeiculoDetalhes;