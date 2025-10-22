// src/pages/VeiculoDetalhes.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, NavLink } from "react-router-dom";
import { ChevronLeft, Plus, Search, Calendar as CalendarIcon, Trash2, ArrowUpDown, Layers } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { format, isWithinInterval, isValid, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext"; // <--- Importar useAuth

// --- Função para formatar moeda ---
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- TIPAGEM E DADOS ---
type Servico = {
  id: number; data: string | null; os: string; cliente: string; operador: string; n_fiscal: string; boleto: string; vencimento: string | null; valor_bruto: number; data_pagamento: string | null; status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'; placa_veiculo: string; observacao: string | null;
  criado_por: string | null; // <--- Adicionada coluna
};

type Despesa = {
    id: number; data: string | null; fornecedor: string; descricao: string; vencimento: string | null; valor_total: number; placa_veiculo: string; observacao: string | null;
    criado_por: string | null; // <--- Adicionada coluna
};

// ... (SortDirection, SortKey, statusOptions, parseDateStringAsLocal - permanecem os mesmos) ...
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
// ... (Componente EditableCell permanece exatamente o mesmo da resposta anterior) ...
type EditableCellProps = {
  value: string | number | Date | null; isEditing: boolean; onToggleEditing: (isEditing: boolean) => void; onSave: (value: any) => void; type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
};

const EditableCell = ({ value: initialValue, onSave, isEditing, onToggleEditing, type = 'text', options = [] }: EditableCellProps) => {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setValue(initialValue); }, [initialValue]);

    const handleSave = () => { onSave(value); onToggleEditing(false); };
    const handleCancel = () => { setValue(initialValue); onToggleEditing(false); };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (type !== 'textarea') {
            if (e.key === 'Enter') handleSave();
        }
        if (e.key === 'Escape') handleCancel();
    };

    useEffect(() => {
        if (isEditing && type === 'textarea' && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditing, type]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };


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
            case 'number': return ( <Input type="number" value={value as number ?? ''} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8 text-xs md:text-sm"/> );
            case 'textarea':
                return (
                    <Textarea
                        ref={textareaRef}
                        value={value as string || ''}
                        onChange={handleTextareaChange}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="min-h-[2rem] text-xs md:text-sm resize-none overflow-hidden"
                        rows={1}
                    />
                );
            default: return ( <Input value={value as string || ''} onChange={(e) => setValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus className="h-8 text-xs md:text-sm"/> );
        }
    }
    let displayValue: React.ReactNode = value;
    if (type === 'date' && value) { const date = parseDateStringAsLocal(value); displayValue = date ? format(date, "dd/MM/yyyy") : '-'; }
    else if (type === 'number') { displayValue = formatCurrency(value as number | null); }
    else if (type === 'textarea') { displayValue = (value as string || '-').split('\n').map((line, i, arr) => <React.Fragment key={i}>{line}{i < arr.length - 1 && <br/>}</React.Fragment>); }
    else if (value === null || value === undefined || value === '') { displayValue = '-'; }

    return ( <div onClick={() => onToggleEditing(true)} className="cursor-pointer min-h-[2rem] flex items-center p-2 -m-2 whitespace-pre-wrap text-xs md:text-sm"> {displayValue} </div> );
};

// --- COMPONENTE PRINCIPAL ---
const VeiculoDetalhes = () => {
  const { placa: placaFromUrl } = useParams<{ placa: string }>();
  const placa = placaFromUrl?.toUpperCase();
  const { user } = useAuth(); // <--- Obter o utilizador logado

  // ... (todos os useState permanecem os mesmos) ...
    const [searchTerm, setSearchTerm] = useState("");
    const [servicos, setServicos] = useState<Partial<Servico>[]>([]);
    const [despesas, setDespesas] = useState<Partial<Despesa>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ table: 'servicos' | 'despesas'; rowIndex: number; columnId: string } | null>(null);
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [servicosSortConfig, setServicosSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'data', direction: 'desc' });
    const [despesasSortConfig, setDespesasSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'data', direction: 'desc' });
    const [servicosSummary, setServicosSummary] = useState({ total: 0, recebido: 0, aReceber: 0, });
    const [despesasSummary, setDespesasSummary] = useState({ total: 0 });
    const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Partial<Servico> | null>(null);
    const [numInstallments, setNumInstallments] = useState(2);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'servicos' | 'despesas' | null>(null);
    const [newItem, setNewItem] = useState<Partial<Servico> | Partial<Despesa>>({});

  // ... (fetchDetails, useEffect, useMemo, requestSort, handleSave, handleDelete, etc. permanecem os mesmos) ...
    // ... (Atenção: A função `select('*')` no fetchDetails já irá buscar a nova coluna `criado_por`) ...
    const fetchDetails = async () => {
        if (!placa) return;
        setLoading(true);
        setError(null);
        // Garantir que 'criado_por' é selecionado (o '*' já faz isso)
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

    useEffect(() => {
        fetchDetails();
    }, [placa]);

    // ... (useMemo para sortedAndFilteredServicos - adicionar 'criado_por' à busca) ...
    const sortedAndFilteredServicos = useMemo(() => {
        let sortableItems = [...servicos];
        if (servicosSortConfig !== null) {
          sortableItems.sort((a, b) => {
            // ... (lógica de ordenação existente) ...
            const aValue = a[servicosSortConfig.key as keyof Servico];
            const bValue = b[servicosSortConfig.key as keyof Servico];
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            if (servicosSortConfig.key === 'data' || servicosSortConfig.key === 'vencimento' || servicosSortConfig.key === 'data_pagamento') {
                 const dateA = parseDateStringAsLocal(aValue as string | Date);
                 const dateB = parseDateStringAsLocal(bValue as string | Date);
                 if (!dateA) return 1;
                 if (!dateB) return -1;
                 const comparison = dateA.getTime() - dateB.getTime();
                 return servicosSortConfig.direction === 'asc' ? comparison : -comparison;
            }
            if (aValue < bValue) return servicosSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return servicosSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
        return sortableItems.filter(item => {
          const searchTermLower = searchTerm.toLowerCase();
          const searchTermMatch = (
              (item.os || '').toLowerCase().includes(searchTermLower) ||
              (item.cliente || '').toLowerCase().includes(searchTermLower) ||
              (item.operador || '').toLowerCase().includes(searchTermLower) ||
              (item.n_fiscal || '').toLowerCase().includes(searchTermLower) ||
              (item.boleto || '').toLowerCase().includes(searchTermLower) ||
              (item.status || '').toLowerCase().includes(searchTermLower) ||
              (item.observacao || '').toLowerCase().includes(searchTermLower) ||
              (item.criado_por || '').toLowerCase().includes(searchTermLower) // <--- Adicionado
           );
          const itemDate = parseDateStringAsLocal(item.data || null);
          let dateMatch = true;
          if (date?.from && itemDate) {
              if (!date.to) { dateMatch = itemDate >= date.from; }
              else { dateMatch = isWithinInterval(itemDate, { start: date.from, end: date.to }); }
          }
          return searchTermMatch && dateMatch;
        });
      }, [servicos, servicosSortConfig, searchTerm, date]);

    // ... (useEffect para servicosSummary - permanece o mesmo) ...
     useEffect(() => {
        const total = sortedAndFilteredServicos.filter(s => s.status !== 'Cancelado').reduce((acc, s) => acc + (s.valor_bruto || 0), 0);
        const recebido = sortedAndFilteredServicos.filter(s => s.status === 'Pago').reduce((acc, s) => acc + (s.valor_bruto || 0), 0);
        const aReceber = sortedAndFilteredServicos.filter(s => s.status === 'Pendente' || s.status === 'Vencido').reduce((acc, s) => acc + (s.valor_bruto || 0), 0);
        setServicosSummary({ total, recebido, aReceber });
    }, [sortedAndFilteredServicos]);

    // ... (useMemo para sortedAndFilteredDespesas - adicionar 'criado_por' à busca) ...
    const sortedAndFilteredDespesas = useMemo(() => {
        let sortableItems = [...despesas];
        if (despesasSortConfig !== null) {
            sortableItems.sort((a, b) => {
                // ... (lógica de ordenação existente) ...
                const aValue = a[despesasSortConfig.key as keyof Despesa];
                const bValue = b[despesasSortConfig.key as keyof Despesa];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                 if (despesasSortConfig.key === 'data' || despesasSortConfig.key === 'vencimento') {
                    const dateA = parseDateStringAsLocal(aValue as string | Date);
                    const dateB = parseDateStringAsLocal(bValue as string | Date);
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    const comparison = dateA.getTime() - dateB.getTime();
                    return despesasSortConfig.direction === 'asc' ? comparison : -comparison;
                }
                if (aValue < bValue) return despesasSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return despesasSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.filter(item => {
            const searchTermLower = searchTerm.toLowerCase();
            const searchTermMatch = (
                (item.fornecedor || '').toLowerCase().includes(searchTermLower) ||
                (item.descricao || '').toLowerCase().includes(searchTermLower) ||
                (item.observacao || '').toLowerCase().includes(searchTermLower) ||
                (item.criado_por || '').toLowerCase().includes(searchTermLower) // <--- Adicionado
            );
            const itemDate = parseDateStringAsLocal(item.data || null);
            let dateMatch = true;
            if (date?.from && itemDate) {
                if (!date.to) { dateMatch = itemDate >= date.from; }
                else { dateMatch = isWithinInterval(itemDate, { start: date.from, end: date.to }); }
            }
            return searchTermMatch && dateMatch;
        });
    }, [despesas, despesasSortConfig, searchTerm, date]);

    // ... (useEffect para despesasSummary - permanece o mesmo) ...
     useEffect(() => {
        const total = sortedAndFilteredDespesas.reduce((acc, d) => acc + (d.valor_total || 0), 0);
        setDespesasSummary({ total });
    }, [sortedAndFilteredDespesas]);

    // ... (requestSort, handleSave, openAddDialog - permanecem os mesmos) ...
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
        // Não permitir editar a coluna 'criado_por'
        if (columnId === 'criado_por') return;

        setEditingCell(null);
        const recordList = table === 'servicos' ? sortedAndFilteredServicos : sortedAndFilteredDespesas;
        const setRecordListState = table === 'servicos' ? setServicos : setDespesas;
        const originalRecord = recordList[rowIndex];
        if (!originalRecord?.id) return;

        const originalIndex = (table === 'servicos' ? servicos : despesas).findIndex(item => item.id === originalRecord.id);
        if (originalIndex === -1) return;

        const updatedValue = value instanceof Date ? format(value, 'yyyy-MM-dd') : value;

        setRecordListState(prev => {
            const newState = [...prev];
            newState[originalIndex] = { ...newState[originalIndex], [columnId]: value };
            return newState;
        });

        const { error } = await supabase.from(table).update({ [columnId]: updatedValue }).eq('id', originalRecord.id);
        if (error) {
            console.error(`Erro ao atualizar ${table}:`, error);
            setError(`Falha ao salvar. Por favor, tente novamente.`);
            fetchDetails();
        }
    };

     const openAddDialog = (type: 'servicos' | 'despesas') => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setAddDialogType(type);
        if (type === 'servicos') {
            setNewItem({
                data: today, os: '', cliente: '', operador: '', n_fiscal: '', boleto: '',
                vencimento: today, valor_bruto: 0, data_pagamento: null, status: 'Pendente', observacao: ''
                // 'criado_por' será adicionado no handleAddNewItem
            });
        } else {
            setNewItem({
                data: today, fornecedor: '', descricao: '', vencimento: today, valor_total: 0, observacao: ''
                // 'criado_por' será adicionado no handleAddNewItem
            });
        }
        setIsAddDialogOpen(true);
      };

// LÓGICA DO DISPLAY NAME:
    // Tenta buscar o 'display_name', senão o 'full_name', senão o email, senão um texto padrão.
    const displayName = user.user_metadata?.display_name || 
                        user.user_metadata?.full_name || 
                        user.email || 
                        'Utilizador Desconhecido';


  // MODIFICAR handleAddNewItem
  const handleAddNewItem = async () => {
    if (!addDialogType || !newItem || !user) { // Garantir que temos um utilizador
        setError("Utilizador não autenticado. Por favor, faça login novamente.");
        return;
    }

    const dataToInsert = { 
      ...newItem, 
      placa_veiculo: placa,
      criado_por: displayName 
  };

    // ... (A lógica de formatação de datas permanece a mesma) ...
    const formatDateField = (field: keyof Servico | keyof Despesa) => {
      // ... (lógica de formatação de data existente) ...
      if (field in dataToInsert) {
          const dateValue = dataToInsert[field as keyof typeof dataToInsert];
          if (dateValue instanceof Date) {
               (dataToInsert as any)[field] = format(dateValue, 'yyyy-MM-dd');
          } else if (typeof dateValue === 'string' && dateValue && !/\d{4}-\d{2}-\d{2}/.test(dateValue)) {
              try { (dataToInsert as any)[field] = format(parseDateStringAsLocal(dateValue)!, 'yyyy-MM-dd'); } catch { (dataToInsert as any)[field] = null; }
          } else if (typeof dateValue === 'string' && !dateValue) {
               (dataToInsert as any)[field] = null;
          }
      }
  };
  formatDateField('data');
  formatDateField('vencimento');
  if ('data_pagamento' in dataToInsert) formatDateField('data_pagamento');


  const { error } = await supabase.from(addDialogType).insert(dataToInsert);

  if (error) {
    console.error(`Erro ao adicionar ${addDialogType}:`, error);
    setError("Falha ao adicionar novo item. Verifique os dados e tente novamente.");
  } else {
    setIsAddDialogOpen(false);
    setNewItem({});
    fetchDetails(); 
  }
};

  // ... (handleDelete, handleOpenInstallmentDialog, handleGenerateInstallments, dateRangeButtonText - permanecem os mesmos) ...
   const handleDelete = async (table: 'servicos' | 'despesas', id: number) => {
        const setRecordList = table === 'servicos' ? setServicos : setDespesas;
        setRecordList(prev => prev.filter(record => record.id !== id));
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.error(`Erro ao excluir ${table}:`, error);
            setError('Falha ao excluir. Por favor, recarregue a página.');
            fetchDetails();
        }
    };

    const handleOpenInstallmentDialog = (servico: Partial<Servico>) => {
        if (servico.os && /\(\d+\/\d+\)/.test(servico.os)) {
            alert("Não é possível parcelar um serviço que já é uma parcela.");
            return;
        }
        setSelectedService(servico);
        setNumInstallments(2);
        setIsInstallmentDialogOpen(true);
    };

    const handleGenerateInstallments = async () => {
        if (!selectedService || !selectedService.id || !selectedService.valor_bruto || !selectedService.vencimento || numInstallments < 2 || !user) {
            alert("Serviço inválido, número de parcelas menor que 2 ou utilizador não identificado.");
            return;
        }

        const { id, valor_bruto, vencimento, ...originalServiceData } = selectedService;
        const installmentValue = parseFloat((valor_bruto / numInstallments).toFixed(2));
        const originalDueDate = parseDateStringAsLocal(vencimento);
        if (!originalDueDate) {
            alert("O serviço original precisa de uma data de vencimento válida.");
            return;
        }

        const newInstallments = Array.from({ length: numInstallments }, (_, i) => ({
            ...originalServiceData,
            os: `${originalServiceData.os || 'S/N'} (${i + 1}/${numInstallments})`,
            valor_bruto: installmentValue,
            vencimento: format(addMonths(originalDueDate, i), 'yyyy-MM-dd'),
            status: 'Pendente' as const,
            data_pagamento: null,
            observacao: `Parcela ${i + 1}/${numInstallments} do serviço original ID ${id}. ${originalServiceData.observacao || ''}`.trim(),
            criado_por: user.email // <--- Adicionar utilizador às parcelas
        }));

        const totalParcelado = newInstallments.reduce((sum, p) => sum + p.valor_bruto, 0);
        const diferenca = parseFloat((valor_bruto - totalParcelado).toFixed(2));
        if (diferenca !== 0) {
            newInstallments[newInstallments.length - 1].valor_bruto = parseFloat((newInstallments[newInstallments.length - 1].valor_bruto + diferenca).toFixed(2));
        }

        const { error: deleteError } = await supabase.from('servicos').delete().eq('id', id);
        if (deleteError) {
            setError("Falha ao remover o serviço original para gerar as parcelas.");
            return;
        }

        const { error: insertError } = await supabase.from('servicos').insert(newInstallments);
        if (insertError) {
            setError("Falha ao criar as parcelas. O serviço original foi removido. Tente adicioná-lo novamente.");
        }

        setIsInstallmentDialogOpen(false);
        setSelectedService(null);
        fetchDetails();
    };

     const dateRangeButtonText = date?.from ? (date.to ? `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}` : format(date.from, "dd/MM/yy")) : "Selecione o período";

  if (loading) return <p>A carregar detalhes do veículo...</p>
  if (error) return <p className="text-destructive">{error}</p>

  // --- JSX (HTML) ---
  return (
    <div className="space-y-4">
      {/* ... (Header, Card Resumo, Card Filtros - permanecem os mesmos) ... */}
        <NavLink to="/veiculos" className="flex items-center text-sm text-primary hover:underline mb-4"><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</NavLink>
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Detalhes do Veículo: {placa}</h1></div>
        <Card>
            <CardHeader><CardTitle>Resumo Financeiro do Veículo</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col"><span className="text-sm text-muted-foreground">Saldo Total</span><span className="text-2xl font-bold">{formatCurrency(servicosSummary.total)}</span></div>
              <div className="flex flex-col"><span className="text-sm text-muted-foreground">Saldo Recebido</span><span className="text-2xl font-bold text-green-600">{formatCurrency(servicosSummary.recebido)}</span></div>
              <div className="flex flex-col"><span className="text-sm text-muted-foreground">À Receber</span><span className="text-2xl font-bold text-orange-500">{formatCurrency(servicosSummary.aReceber)}</span></div>
              <div className="flex flex-col"><span className="text-sm text-muted-foreground">Total Despesas</span><span className="text-2xl font-bold text-red-600">{formatCurrency(despesasSummary.total)}</span></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
                <Popover>
                  <PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" /><span>{dateRangeButtonText}</span></Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/></PopoverContent>
                </Popover>
              </div>
            </CardHeader>
        </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Tabela de Serviços - Adicionar coluna */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Serviços Realizados</CardTitle>
            <Button size="sm" onClick={() => openAddDialog('servicos')}><Plus className="h-4 w-4 mr-2" /> Adicionar Serviço</Button>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card">
                    {/* ... (TableHeads existentes) ... */}
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('data', 'servicos')}>Data <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[150px]"><Button variant="ghost" onClick={() => requestSort('os', 'servicos')}>O.S <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]"><Button variant="ghost" onClick={() => requestSort('cliente', 'servicos')}>Cliente <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[150px]">Operador</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[100px]">N° Fiscal</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[100px]">Boleto</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('vencimento', 'servicos')}>Vencimento <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[130px]"><Button variant="ghost" onClick={() => requestSort('valor_bruto', 'servicos')}>Valor Bruto <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]">Data Pagto.</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('status', 'servicos')}>Status <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]">Observação</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]">Criado Por</TableHead> {/* <--- Nova Coluna */}
                    <TableHead className="sticky top-0 bg-inherit text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredServicos.map((servico, rowIndex) => (
                    <TableRow key={servico.id || `new-${rowIndex}`} className={cn( servico.os && /\(\d+\/\d+\)/.test(servico.os) ? 'bg-blue-50 hover:bg-blue-100' : '' )}>
                        {/* ... (TableCells existentes com EditableCell) ... */}
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
                        <TableCell><EditableCell type="textarea" value={servico.observacao} isEditing={editingCell?.table === 'servicos' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'observacao'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'servicos', rowIndex, columnId: 'observacao' } : null)} onSave={(value) => handleSave('servicos', rowIndex, 'observacao', value)}/></TableCell>
                        {/* Nova Célula (Apenas leitura) */}
                        <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {servico.criado_por || '-'}
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end"><Button variant="ghost" size="icon" onClick={() => handleOpenInstallmentDialog(servico)} title="Parcelar serviço"><Layers className="h-4 w-4 text-blue-600" /></Button>{servico.id && (<AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá excluir permanentemente o serviço.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('servicos', servico.id!)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabela de Despesas - Adicionar coluna */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manutenção / Despesas</CardTitle>
            <Button size="sm" onClick={() => openAddDialog('despesas')}><Plus className="h-4 w-4 mr-2" /> Adicionar Despesa</Button>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card">
                    {/* ... (TableHeads existentes) ... */}
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('data', 'despesas')}>Data <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]"><Button variant="ghost" onClick={() => requestSort('fornecedor', 'despesas')}>Fornecedor <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[200px]">Descrição</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[120px]"><Button variant="ghost" onClick={() => requestSort('vencimento', 'despesas')}>Vencimento <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[130px]"><Button variant="ghost" onClick={() => requestSort('valor_total', 'despesas')}>Valor Total <ArrowUpDown className="h-4 w-4 inline ml-2" /></Button></TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]">Observação</TableHead>
                    <TableHead className="sticky top-0 bg-inherit min-w-[180px]">Criado Por</TableHead> {/* <--- Nova Coluna */}
                    <TableHead className="sticky top-0 bg-inherit text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {sortedAndFilteredDespesas.map((despesa, rowIndex) => (
                    <TableRow key={despesa.id || `new-${rowIndex}`}>
                        {/* ... (TableCells existentes com EditableCell) ... */}
                        <TableCell><EditableCell type="date" value={despesa.data} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'data'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'data' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'data', value)}/></TableCell>
                        <TableCell><EditableCell type="text" value={despesa.fornecedor} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'fornecedor'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'fornecedor' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'fornecedor', value)}/></TableCell>
                        <TableCell><EditableCell type="text" value={despesa.descricao} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'descricao'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'descricao' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'descricao', value)}/></TableCell>
                        <TableCell><EditableCell type="date" value={despesa.vencimento} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'vencimento'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'vencimento' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'vencimento', value)}/></TableCell>
                        <TableCell><EditableCell type="number" value={despesa.valor_total} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'valor_total'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'valor_total' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'valor_total', value)}/></TableCell>
                        <TableCell><EditableCell type="textarea" value={despesa.observacao} isEditing={editingCell?.table === 'despesas' && editingCell.rowIndex === rowIndex && editingCell.columnId === 'observacao'} onToggleEditing={(isEditing) => setEditingCell(isEditing ? { table: 'despesas', rowIndex, columnId: 'observacao' } : null)} onSave={(value) => handleSave('despesas', rowIndex, 'observacao', value)}/></TableCell>
                        {/* Nova Célula (Apenas leitura) */}
                        <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {despesa.criado_por || '-'}
                        </TableCell>
                        <TableCell className="text-right">{despesa.id && (<AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá excluir permanentemente a despesa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('despesas', despesa.id!)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}</TableCell>
                    </TableRow>
                 ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ... (Dialog de Adicionar - não precisa de mudança, pois 'criado_por' é tratado no handleAddNewItem) ... */}
       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo {addDialogType === 'servicos' ? 'Serviço' : 'Despesa'}</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para adicionar um novo item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            {addDialogType === 'servicos' && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="data" className="text-right">Data</Label><Input id="data" type="date" value={(newItem as Partial<Servico>).data || ''} onChange={(e) => setNewItem(prev => ({ ...prev, data: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="os" className="text-right">O.S</Label><Input id="os" value={(newItem as Partial<Servico>).os || ''} onChange={(e) => setNewItem(prev => ({ ...prev, os: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="cliente" className="text-right">Cliente</Label><Input id="cliente" value={(newItem as Partial<Servico>).cliente || ''} onChange={(e) => setNewItem(prev => ({ ...prev, cliente: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="operador" className="text-right">Operador</Label><Input id="operador" value={(newItem as Partial<Servico>).operador || ''} onChange={(e) => setNewItem(prev => ({ ...prev, operador: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="n_fiscal" className="text-right">N° Fiscal</Label><Input id="n_fiscal" value={(newItem as Partial<Servico>).n_fiscal || ''} onChange={(e) => setNewItem(prev => ({ ...prev, n_fiscal: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="boleto" className="text-right">Boleto</Label><Input id="boleto" value={(newItem as Partial<Servico>).boleto || ''} onChange={(e) => setNewItem(prev => ({ ...prev, boleto: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="vencimento" className="text-right">Vencimento</Label><Input id="vencimento" type="date" value={(newItem as Partial<Servico>).vencimento || ''} onChange={(e) => setNewItem(prev => ({ ...prev, vencimento: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="valor_bruto" className="text-right">Valor Bruto</Label><Input id="valor_bruto" type="number" value={(newItem as Partial<Servico>).valor_bruto || ''} onChange={(e) => setNewItem(prev => ({ ...prev, valor_bruto: parseFloat(e.target.value) || 0 }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="data_pagamento" className="text-right">Data Pagto.</Label><Input id="data_pagamento" type="date" value={(newItem as Partial<Servico>).data_pagamento || ''} onChange={(e) => setNewItem(prev => ({ ...prev, data_pagamento: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label><Select value={(newItem as Partial<Servico>).status} onValueChange={(value) => setNewItem(prev => ({...prev, status: value as Servico['status']}))}><SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{statusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="observacao_servico" className="text-right">Observação</Label><Textarea id="observacao_servico" value={(newItem as Partial<Servico>).observacao || ''} onChange={(e) => setNewItem(prev => ({ ...prev, observacao: e.target.value }))} className="col-span-3"/></div>
                </>
            )}
            {addDialogType === 'despesas' && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="data" className="text-right">Data</Label><Input id="data" type="date" value={(newItem as Partial<Despesa>).data || ''} onChange={(e) => setNewItem(prev => ({ ...prev, data: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="fornecedor" className="text-right">Fornecedor</Label><Input id="fornecedor" value={(newItem as Partial<Despesa>).fornecedor || ''} onChange={(e) => setNewItem(prev => ({ ...prev, fornecedor: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="descricao" className="text-right">Descrição</Label><Input id="descricao" value={(newItem as Partial<Despesa>).descricao || ''} onChange={(e) => setNewItem(prev => ({ ...prev, descricao: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="vencimento" className="text-right">Vencimento</Label><Input id="vencimento" type="date" value={(newItem as Partial<Despesa>).vencimento || ''} onChange={(e) => setNewItem(prev => ({ ...prev, vencimento: e.target.value }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="valor_total" className="text-right">Valor Total</Label><Input id="valor_total" type="number" value={(newItem as Partial<Despesa>).valor_total || ''} onChange={(e) => setNewItem(prev => ({ ...prev, valor_total: parseFloat(e.target.value) || 0 }))} className="col-span-3"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="observacao_despesa" className="text-right">Observação</Label><Textarea id="observacao_despesa" value={(newItem as Partial<Despesa>).observacao || ''} onChange={(e) => setNewItem(prev => ({ ...prev, observacao: e.target.value }))} className="col-span-3"/></div>
                </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleAddNewItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ... (Dialog de Parcelamento - permanece o mesmo) ... */}
      <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Gerar Parcelamento para O.S {selectedService?.os}</DialogTitle>
                <DialogDescription>O serviço original será removido e substituído pelo número de parcelas definido. O valor será dividido e os vencimentos serão mensais.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="installments" className="text-right">Número de Parcelas</Label>
                    <Input id="installments" type="number" value={numInstallments} onChange={(e) => setNumInstallments(parseInt(e.target.value, 10))} className="col-span-3" min="2"/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsInstallmentDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerateInstallments}>Confirmar Parcelamento</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VeiculoDetalhes;