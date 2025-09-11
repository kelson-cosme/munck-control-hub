import { useEffect, useState } from "react";
import { Calculator, TrendingUp, FileText } from "lucide-react";
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
import { supabase } from "@/lib/supabaseClient";
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
interface Servico {
  id: number;
  cliente: string;
  placa_veiculo: string;
  valor_bruto: number;
  status: 'Pago' | 'Pendente' | 'Vencido' | 'Cancelado';
  data: string;
  data_pagamento: string | null;
  vencimento: string;
}

interface Despesa {
    id: number;
    valor_total: number;
    data: string;
}

// Função para formatar moeda
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- CORREÇÃO DE FUSO HORÁRIO ---
const parseDateStringAsLocal = (dateString: string | null | Date): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    // Adicionar T00:00:00 força o JS a interpretar a data no fuso horário local
    const date = new Date(`${dateString}T00:00:00`);
    return isValid(date) ? date : null;
}

const Dashboard = () => {
    const [summary, setSummary] = useState({
        totalRecebido: 0,
        totalAReceber: 0,
        despesas: 0,
        valorLiquido: 0,
    });
    const [previsaoRecebimento, setPrevisaoRecebimento] = useState<{periodo: string, valor: number}[]>([]);
    const [servicosPendentes, setServicosPendentes] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [monthOptions, setMonthOptions] = useState<{ value: string; label: string; }[]>([]);

    useEffect(() => {
        const fetchDataAndCalculate = async () => {
            setLoading(true);
            setError(null);
            
            const [servicosResponse, despesasResponse] = await Promise.all([
                supabase.from('servicos').select('id, cliente, placa_veiculo, valor_bruto, status, data, data_pagamento, vencimento'),
                supabase.from('despesas').select('id, valor_total, data')
            ]);

            if (servicosResponse.error || despesasResponse.error) {
                console.error("Erro ao buscar dados:", servicosResponse.error || despesasResponse.error);
                setError("Não foi possível carregar os dados do dashboard.");
                setLoading(false);
                return;
            }

            const allServicos: Servico[] = servicosResponse.data || [];
            const allDespesas: Despesa[] = despesasResponse.data || [];

            const dates = [...allServicos.map(s => s.data), ...allDespesas.map(d => d.data)];
            const uniqueMonths = [...new Set(dates.map(d => format(parseISO(d), 'yyyy-MM')))];
            const options = uniqueMonths.sort().reverse().map(monthStr => ({
                value: monthStr,
                label: format(parseISO(`${monthStr}-01`), "MMMM 'de' yyyy", { locale: ptBR })
            }));
            setMonthOptions(options);

            const servicos = selectedMonth === 'all' 
                ? allServicos 
                : allServicos.filter(s => s.data && s.data.startsWith(selectedMonth));

            const despesas = selectedMonth === 'all'
                ? allDespesas
                : allDespesas.filter(d => d.data && d.data.startsWith(selectedMonth));

            const totalRecebido = servicos
                .filter(s => s.status === 'Pago')
                .reduce((acc, s) => acc + s.valor_bruto, 0);

            const totalAReceber = allServicos
                .filter(s => s.status === 'Pendente' || s.status === 'Vencido')
                .reduce((acc, s) => acc + s.valor_bruto, 0);

            const despesasTotal = despesas.reduce((acc, d) => acc + d.valor_total, 0);
            
            setSummary({
                totalRecebido,
                totalAReceber,
                despesas: despesasTotal,
                valorLiquido: totalRecebido - despesasTotal
            });

            const pendentes = allServicos
                .filter(s => s.status === 'Pendente' || s.status === 'Vencido')
                .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
            setServicosPendentes(pendentes);

            const today = new Date();
            const periodos = [
                { label: 'Próximos 7 dias', start: today, end: addDays(today, 7) },
                { label: 'Próximos 15 dias', start: addDays(today, 8), end: addDays(today, 15) },
                { label: 'Próximos 30 dias', start: addDays(today, 16), end: addDays(today, 30) },
            ];
            
            const previsao = periodos.map(p => {
                const valor = pendentes
                    .filter(s => {
                        const vencimentoDate = parseDateStringAsLocal(s.vencimento);
                        return vencimentoDate && isWithinInterval(vencimentoDate, { start: p.start, end: p.end });
                    })
                    .reduce((acc, s) => acc + s.valor_bruto, 0);
                return { periodo: p.label, valor };
            });
            setPrevisaoRecebimento(previsao);

            setLoading(false);
        };

        fetchDataAndCalculate();
    }, [selectedMonth]);

    const summaryLabel = selectedMonth === 'all' ? '(Geral)' : `(${format(parseISO(`${selectedMonth}-01`), "MMM/yy", { locale: ptBR })})`;

    if (loading) return <p>A carregar dashboard...</p>
    if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-2xl font-bold">Dashboard - Sistema de Gestão Munck</h1>
            <p className="text-muted-foreground">Resumo financeiro e operacional</p>
        </div>
        <div className="mt-4 sm:mt-0">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Visão Geral</SelectItem>
                    {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Total Recebido {summaryLabel}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.totalRecebido)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total a Receber (Geral)</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.totalAReceber)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Despesas {summaryLabel}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(summary.despesas)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Valor Líquido {summaryLabel}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(summary.valorLiquido)}</TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsão de Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {previsaoRecebimento.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.periodo}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Serviços Pendentes de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicosPendentes.slice(0, 5).map((servico) => {
                const vencimentoDate = parseDateStringAsLocal(servico.vencimento);
                return (
                    <TableRow key={servico.id}>
                    <TableCell>{servico.cliente}</TableCell>
                    <TableCell>{servico.placa_veiculo}</TableCell>
                    <TableCell>{formatCurrency(servico.valor_bruto)}</TableCell>
                    <TableCell>
                        {vencimentoDate ? format(vencimentoDate, 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{servico.status}</TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;