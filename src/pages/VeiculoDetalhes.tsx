import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, NavLink } from "react-router-dom";
import { ChevronLeft, Plus, Search, Calendar as CalendarIcon, Trash2, ArrowUpDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  id: number; data: string | null; os: string; cliente: string; operador: string; n_fiscal: string; boleto: string; vencimento: string | null; valor_bruto: number; data_pagamento: string | null; status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'; placa_veiculo: string;
};

type Despesa = {
    id: number; data: string | null; fornecedor: string; descricao: string; vencimento: string | null; valor_total: number; placa_veiculo: string;
};

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Servico | keyof Despesa;

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
    useEffect(() => { setValue(initialValue); }, [initialValue]);
    const handleSave = () => { onSave(value); onToggleEditing(false); };
    const handleCancel = () => { setValue(initialValue); onToggleEditing(false); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); };
    if (isEditing) {
        const currentDate = parseDateStringAsLocal(value);
        switch (type) {
            case 'date': 
                return ( 
                    <Popover open onOpenChange={(isOpen) => !isOpen && handleSave()}> 
                        <PopoverTrigger className="w-full">
                            <div className={cn(buttonVariants({ variant: "outline" }), "h-8 w-full justify-start text-left font-normal text-xs md:text-sm")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentDate ? format(currentDate, "dd/MM/yyyy") : "Selecione..."}
                            </div>
                        </PopoverTrigger> 
                        <PopoverContent className="w-auto p-0"> 
                            <Calendar 
                                mode="single" 
                                selected={currentDate || undefined} 
                                onSelect={(date) => setValue(date || null)} 
                                initialFocus 
                            /> 
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
  const [highlightedRow, setHighlightedRow] = useState<{ table: string; index: number } | null>(null);
  
  const [servicosSortConfig, setServicosSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'data', direction: 'desc' });
  const [despesasSortConfig, setDespesasSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'data', direction: 'desc' });
  
  const [servicosSummary, setServicosSummary] = useState({
    total: 0,
    recebido: 0,
    aReceber: 0,
  });

  const servicosContentRef = useRef<HTMLDivElement>(null);
  const despesasContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!placa) return;
      setLoading(true);
      setError(null);
      const [servicosResponse, despesasResponse] = await Promise.all([
        supabase.from('servicos').select('*').eq('placa_veiculo', placa),
        supabase.from('despesas').select('*').eq('placa_veiculo', placa)
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

  const sortedAndFilteredServicos = useMemo(() => {
    let sortableItems = [...servicos];
    if (servicosSortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[servicosSortConfig.key as keyof Servico];
        const bValue = b[servicosSortConfig.key as keyof Servico];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return servicosSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return servicosSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems.filter(item => {
      const searchTermMatch = ((item.os || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()));
      const itemDate = parseDateStringAsLocal(item.data || null);
      if (!itemDate) return searchTermMatch;
      const dateMatch = date?.from && date?.to ? isWithinInterval(itemDate, { start: date.from, end: date.to }) : true;
      return searchTermMatch && dateMatch;
    });
  }, [servicos, servicosSortConfig, searchTerm, date]);

  useEffect(() => {
    const total = sortedAndFilteredServicos
        .filter(s => s.status !== 'Cancelado')
        .reduce((acc, s) => acc + (s.valor_bruto || 0), 0);

    const recebido = sortedAndFilteredServicos
        .filter(s => s.status === 'Pago')
        .reduce((acc, s) => acc + (s.valor_bruto || 0), 0);
    
    const aReceber = sortedAndFilteredServicos
        .filter(s => s.status === 'Pendente' || s.status === 'Vencido')
        .reduce((acc, s) => acc + (s.valor_bruto || 0), 0);

    setServicosSummary({ total, recebido, aReceber });
  }, [sortedAndFilteredServicos]);

  const sortedAndFilteredDespesas = useMemo(() => {
    let sortableItems = [...despesas];
    if (despesasSortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[despesasSortConfig.key as keyof Despesa];
            const bValue = b[despesasSortConfig.key as keyof Despesa];
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            if (aValue < bValue) return despesasSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return despesasSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems.filter(item => {
        const searchTermMatch = ((item.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()));
        const itemDate = parseDateStringAsLocal(item.data || null);
        if (!itemDate) return searchTermMatch;
        const dateMatch = date?.from && date?.to ? isWithinInterval(itemDate, { start: date.from, end: date.to }) : true;
        return searchTermMatch && dateMatch;
    });
  }, [despesas, despesasSortConfig, searchTerm, date]);

  const requestSort = (key: SortKey, table: 'servicos' | 'despesas') => {
    const config = table === 'servicos' ? servicosSortConfig : despesasSortConfig;
    const setConfig = table === 'servicos' ? setServicosSortConfig : setDespesasSortConfig;
    let direction: SortDirection = 'asc';
    if (config && config.key === key && config.direction === 'asc') {
      direction = 'desc';
    }
    setConfig({ key, direction });
  };

  const handleSave = async (table: 'servicos' | 'despesas', rowIndex: number, columnId: string, value: any) => {
    setEditingCell(null);
    const recordList = table === 'servicos' ? sortedAndFilteredServicos : sortedAndFilteredDespesas;
    const setRecordListState = table === 'servicos' ? setServicos : setDespesas;
    const recordToUpdate = recordList[rowIndex];
    const updatedValue = value instanceof Date ? format(value, 'yyyy-MM-dd') : value;
    
    if (!recordToUpdate.id) {
      const recordToInsert = { ...recordToUpdate, [columnId]: updatedValue, placa_veiculo: placa };
      setRecordListState(prev => prev.map(item => item === recordToUpdate ? recordToInsert : item));

      const { data, error } = await supabase.from(table).insert(recordToInsert).select().single();
      if (error) {
        console.error(`Erro ao inserir ${table}:`, error);
        setError(`Falha ao salvar. Por favor, tente novamente.`);
        setRecordListState(prev => prev.filter(item => item !== recordToInsert));
      } else {
        setRecordListState(prev => prev.map(item => item === recordToInsert ? data : item));
      }
    } else {
      setRecordListState(prev => prev.map(item => item.id === recordToUpdate.id ? { ...item, [columnId]: updatedValue } : item));
      const { error } = await supabase.from(table).update({ [columnId]: updatedValue }).eq('id', recordToUpdate.id);
      if (error) {
        console.error(`Erro ao atualizar ${table}:`, error);
        setError(`Falha ao salvar. Por favor, tente novamente.`);
      }
    }
  };
  
  const handleAddRow = (table: 'servicos' | 'despesas') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (table === 'servicos') {
        const newServico: Partial<Servico> = { data: today, os: '', cliente: '', operador: '', n_fiscal: '', boleto: '', vencimento: today, valor_bruto: 0, data_pagamento: null, status: 'Pendente' };
        setServicos(prev => {
            const newIndex = prev.length;
            setTimeout(() => {
                servicosContentRef.current?.scrollTo({ top: servicosContentRef.current.scrollHeight, behavior: 'smooth' });
                setHighlightedRow({ table: 'servicos', index: newIndex });
                setTimeout(() => setHighlightedRow(null), 3000);
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
                setHighlightedRow({ table: 'despesas', index: newIndex });
                setTimeout(() => setHighlightedRow(null), 3000);
                setEditingCell({ table: 'despesas', rowIndex: newIndex, columnId: 'data' });
            }, 100);
            return [...prev, newDespesa];
        });
    }
  };

  const handleDelete = async (table: 'servicos' | 'despesas', id: number) => {
    const setRecordList = table === 'servicos' ? setServicos : setDespesas;
    setRecordList(prev => prev.filter(record => record.id !== id));
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        console.error(`Erro ao excluir ${table}:`, error);
        setError('Falha ao excluir. Por favor, recarregue a página.');
    }
  };
  
  const dateRangeButtonText = date?.from
    ? date.to
      ? `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}`
      : format(date.from, "dd/MM/yy")
    : "Selecione o período";

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
          <CardTitle>Resumo dos Serviços</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Saldo Total</span>
            <span className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servicosSummary.total)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Saldo Recebido</span>
            <span className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servicosSummary.recebido)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">À Receber</span>
            <span className="text-2xl font-bold text-orange-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servicosSummary.aReceber)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{dateRangeButtonText}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Serviços Realizados</CardTitle>
            <Button size="sm" onClick={() => handleAddRow('servicos')}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Serviço
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[60vh]" ref={servicosContentRef}>
            <Table>
              <TableHeader className="bg-green-100 sticky top-0">
                <TableRow>
                    <TableHead className="min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('data', 'servicos')}>Data <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="min-w-[150px]"><Button variant="ghost" onClick={() => requestSort('os', 'servicos')}>O.S <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead> 
                    <TableHead className="min-w-[180px]"><Button variant="ghost" onClick={() => requestSort('cliente', 'servicos')}>Cliente <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="min-w-[150px]">Operador</TableHead>
                    <TableHead className="min-w-[100px]">N° Fiscal</TableHead>
                    <TableHead className="min-w-[100px]">Boleto</TableHead>
                    <TableHead className="min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('vencimento', 'servicos')}>Vencimento <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="min-w-[130px]"><Button variant="ghost" onClick={() => requestSort('valor_bruto', 'servicos')}>Valor Bruto <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="min-w-[120px]">Data Pagto.</TableHead>
                    <TableHead className="min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('status', 'servicos')}>Status <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredServicos.map((servico, rowIndex) => (
                  <TableRow 
                    key={servico.id || `new-${rowIndex}`}
                    className={cn( "transition-colors duration-1000", highlightedRow?.table === 'servicos' && highlightedRow?.index === servicos.findIndex(s => s === servico) ? 'bg-green-100' : '' )}
                  >
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
          <CardContent className="overflow-auto max-h-[60vh]" ref={despesasContentRef}>
            <Table>
              <TableHeader className="bg-green-100 sticky top-0">
                <TableRow>
                  <TableHead className="min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('data', 'despesas')}>Data <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                  <TableHead className="min-w-[180px]"><Button variant="ghost" onClick={() => requestSort('fornecedor', 'despesas')}>Fornecedor <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                  <TableHead className="min-w-[200px]">Descrição</TableHead>
                  <TableHead className="min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('vencimento', 'despesas')}>Vencimento <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                  <TableHead className="min-w-[130px]"><Button variant="ghost" onClick={() => requestSort('valor_total', 'despesas')}>Valor Total <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {sortedAndFilteredDespesas.map((despesa, rowIndex) => (
                  <TableRow 
                    key={despesa.id || `new-${rowIndex}`}
                    className={cn( "transition-colors duration-1000", highlightedRow?.table === 'despesas' && highlightedRow?.index === despesas.findIndex(d => d === despesa) ? 'bg-green-100' : '' )}
                  >
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