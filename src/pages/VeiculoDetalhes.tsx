import { useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { ChevronLeft, Plus, Search, Calendar as CalendarIcon } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import { format, isWithinInterval, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// --- TIPAGEM E DADOS ---

type Servico = {
  os: string; data: Date; cliente: string; operador: string; valorBruto: number; formaPagamento: 'PIX' | 'Boleto' | 'Cartão' | 'Dinheiro'; status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'; veiculo: string;
};

type Despesa = {
  data: Date; fornecedor: string; descricao: string; vencimento: Date; valor: number; status: 'Pendente' | 'Pago' | 'Agendado';
};

const statusOptions: Servico['status'][] = ['Pendente', 'Pago', 'Vencido', 'Cancelado'];
const pagamentoOptions: Servico['formaPagamento'][] = ['PIX', 'Boleto', 'Cartão', 'Dinheiro'];

const allServices: Servico[] = [
    { os: "OS-001", data: new Date("2024-08-04"), cliente: "SPL Engenharia", operador: "Thiago", valorBruto: 480.00, formaPagamento: "Boleto", status: "Pendente", veiculo: "FJA-8H16" },
    { os: "6528", data: new Date("2024-08-07"), cliente: "C Vale", operador: "Thiago", valorBruto: 515.00, formaPagamento: "PIX", status: "Pago", veiculo: "FJA-8H16" },
    { os: "6523", data: new Date("2024-08-06"), cliente: "HFC", operador: "Thiago", valorBruto: 530.00, formaPagamento: "Boleto", status: "Pendente", veiculo: "FJA-8H16" },
];

const allDespesas: Despesa[] = [
    { data: new Date("2025-08-01"), fornecedor: "Posto Iris", descricao: "Abastecimento Diesel S10", vencimento: new Date("2025-08-20"), valor: 1178.71, status: "Pendente" },
    { data: new Date("2025-08-05"), fornecedor: "Hidromares", descricao: "Mangueira 1/2 T.C MxF", vencimento: new Date("2025-08-20"), valor: 392.74, status: "Pendente" },
    { data: new Date("2025-08-06"), fornecedor: "Restaurante", descricao: "Almoço - taxa de entrega", vencimento: new Date("2025-08-06"), valor: 76.00, status: "Pago" },
];


// --- COMPONENTE DE CÉLULA EDITÁVEL --- (Sem alterações)
type EditableCellProps = {
  value: string | number | Date; isEditing: boolean; onToggleEditing: (isEditing: boolean) => void; onSave: (value: any) => void; type?: 'text' | 'number' | 'date' | 'select'; options?: string[];
};
const EditableCell = ({ value: initialValue, onSave, isEditing, onToggleEditing, type = 'text', options = [] }: EditableCellProps) => {
    const [value, setValue] = useState(initialValue);
    const handleSave = () => { onSave(value); onToggleEditing(false); };
    const handleCancel = () => { setValue(initialValue); onToggleEditing(false); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); };
    if (isEditing) {
        switch (type) {
            case 'date': return ( <Popover open onOpenChange={(isOpen) => !isOpen && handleSave()}> <PopoverTrigger asChild> <Button variant="outline" className="h-8 w-full justify-start font-normal"> {value instanceof Date ? format(value, "dd/MM/yyyy") : "Selecione..."} </Button> </PopoverTrigger> <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={value instanceof Date ? value : undefined} onSelect={(date) => date && setValue(date)} initialFocus /> </PopoverContent> </Popover> );
            case 'select': return ( <Select value={value as string} onValueChange={(newValue) => onSave(newValue)}> <SelectTrigger className="h-8"> <SelectValue placeholder="Selecione..." /> </SelectTrigger> <SelectContent> {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)} </SelectContent> </Select> );
            case 'number': return ( <Input type="number" value={value as number} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8"/> );
            default: return ( <Input value={value as string} onChange={(e) => setValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8"/> );
        }
    }
    let displayValue: React.ReactNode = value;
    if (value instanceof Date) { displayValue = format(value, "dd/MM/yyyy"); } 
    else if (typeof value === 'number') { displayValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    return ( <div onClick={() => onToggleEditing(true)} className="cursor-pointer min-h-[2rem] flex items-center"> {displayValue} </div> );
};

// --- COMPONENTE PRINCIPAL ---
const VeiculoDetalhes = () => {
  const { placa } = useParams<{ placa: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [servicos, setServicos] = useState<Servico[]>(allServices.filter(s => s.veiculo === placa));
  const [despesas, setDespesas] = useState<Despesa[]>(allDespesas); // Simplesmente pegando todas por enquanto
  const [editingCell, setEditingCell] = useState<{ table: 'servicos' | 'despesas'; rowIndex: number; columnId: string } | null>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const filterByDateAndTerm = (items: (Servico | Despesa)[]) => {
      return items.filter(item => {
          const searchTermMatch = 'cliente' in item ?
            (item.os.toLowerCase().includes(searchTerm.toLowerCase()) || item.cliente.toLowerCase().includes(searchTerm.toLowerCase())) :
            (item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) || item.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const itemDate = item.data;
          if (!isValid(itemDate)) return false;

          const dateMatch = date?.from && date?.to ? isWithinInterval(itemDate, { start: date.from, end: date.to }) : true;

          return searchTermMatch && dateMatch;
      });
  }

  const filteredServicos = filterByDateAndTerm(servicos) as Servico[];
  const filteredDespesas = filterByDateAndTerm(despesas) as Despesa[];

  const handleSave = (table: 'servicos' | 'despesas', rowIndex: number, columnId: string, value: any) => {
    if (table === 'servicos') {
      const updated = servicos.map((row, idx) => idx === rowIndex ? { ...row, [columnId]: value } : row);
      setServicos(updated as Servico[]);
    }
    if (table === 'despesas') {
      const updated = despesas.map((row, idx) => idx === rowIndex ? { ...row, [columnId]: value } : row);
      setDespesas(updated as Despesa[]);
    }
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      <NavLink to="/veiculos" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Voltar para a lista de veículos
      </NavLink>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes do Veículo: {placa}</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
        <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
      
      {/* Grid de Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicos.map((servico, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell><EditableCell type="text" value={servico.os} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'os'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'os' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'os', value)}/></TableCell>
                    <TableCell><EditableCell type="date" value={servico.data} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'data' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'data', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={servico.cliente} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'cliente'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'cliente' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'cliente', value)}/></TableCell>
                    <TableCell><EditableCell type="number" value={servico.valorBruto} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'valorBruto'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'valorBruto' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'valorBruto', value)}/></TableCell>
                    <TableCell><EditableCell type="select" options={statusOptions} value={servico.status} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'status'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'status' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'status', value)}/></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Coluna de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Manutenção / Despesas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredDespesas.map((despesa, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell><EditableCell type="date" value={despesa.data} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'data' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'data', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={despesa.fornecedor} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'fornecedor'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'fornecedor' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'fornecedor', value)}/></TableCell>
                    <TableCell><EditableCell type="text" value={despesa.descricao} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'descricao'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'descricao' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'descricao', value)}/></TableCell>
                    <TableCell><EditableCell type="number" value={despesa.valor} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'valor'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'valor' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'valor', value)}/></TableCell>
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