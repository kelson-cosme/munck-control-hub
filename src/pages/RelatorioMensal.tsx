import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";

type Servico = {
  id: number; data: string; os: string; cliente: string; placa_veiculo: string; valor_bruto: number; status: string;
};

type Despesa = {
  id: number; data: string; fornecedor: string; descricao: string; valor_total: number; placa_veiculo: string;
};

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const RelatorioMensal = () => {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [monthOptions, setMonthOptions] = useState<{ value: string; label: string; }[]>([]);
    const [reportData, setReportData] = useState<{ servicos: Servico[], despesas: Despesa[] }>({ servicos: [], despesas: [] });
    const [summary, setSummary] = useState({ faturamento: 0, despesas: 0, saldo: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateMonthOptions = () => {
            const options = [];
            const today = new Date();
            for (let i = 0; i < 12; i++) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const value = format(date, 'yyyy-MM');
                const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
                options.push({ value, label });
            }
            setMonthOptions(options);
        };
        generateMonthOptions();
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!selectedMonth) return;

            setLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = format(startOfMonth(new Date(Number(year), Number(month) - 1)), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(new Date(Number(year), Number(month) - 1)), 'yyyy-MM-dd');

            const { data: servicosData, error: servicosError } = await supabase
                .from('servicos')
                .select('*')
                .gte('data', startDate)
                .lte('data', endDate)
                .order('data', { ascending: true });

            const { data: despesasData, error: despesasError } = await supabase
                .from('despesas')
                .select('*')
                .gte('data', startDate)
                .lte('data', endDate)
                .order('data', { ascending: true });

            if (servicosError || despesasError) {
                console.error("Erro ao buscar dados do relatório:", servicosError || despesasError);
                setLoading(false);
                return;
            }

            const faturamento = (servicosData || [])
                .filter(s => s.status !== 'Cancelado')
                .reduce((acc, s) => acc + s.valor_bruto, 0);

            const totalDespesas = (despesasData || []).reduce((acc, d) => acc + d.valor_total, 0);

            setReportData({ servicos: servicosData || [], despesas: despesasData || [] });
            setSummary({ faturamento, despesas: totalDespesas, saldo: faturamento - totalDespesas });
            setLoading(false);
        };

        fetchReportData();
    }, [selectedMonth]);

    return (
        <div className="space-y-4">
            <NavLink to="/relatorios" className="flex items-center text-sm text-primary hover:underline mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Relatórios
            </NavLink>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Relatório Mensal</h1>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full sm:w-[280px] mt-2 sm:mt-0">
                        <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? <p>Gerando relatório...</p> : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo do Mês</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Faturamento Bruto</span>
                                <span className="text-2xl font-bold text-green-600">{formatCurrency(summary.faturamento)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Total de Despesas</span>
                                <span className="text-2xl font-bold text-red-600">{formatCurrency(summary.despesas)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Saldo do Mês</span>
                                <span className="text-2xl font-bold">{formatCurrency(summary.saldo)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Serviços Realizados</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Veículo</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.servicos.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell>{format(new Date(s.data + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{s.cliente}</TableCell>
                                                <TableCell>{s.placa_veiculo}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(s.valor_bruto)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Despesas do Mês</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Fornecedor/Descrição</TableHead>
                                            <TableHead>Veículo</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.despesas.map(d => (
                                            <TableRow key={d.id}>
                                                <TableCell>{format(new Date(d.data + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{d.fornecedor || d.descricao}</TableCell>
                                                <TableCell>{d.placa_veiculo}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(d.valor_total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default RelatorioMensal;