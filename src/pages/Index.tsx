// src/pages/Index.tsx
import { useEffect, useState } from "react";
import { Calculator, TrendingUp, FileText, Printer } from "lucide-react"; // Mantém Printer
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
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabaseClient";
import { format, isWithinInterval, addDays, parseISO, isValid, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Interfaces
interface Servico {
  id: number;
  cliente: string;
  placa_veiculo: string;
  valor_bruto: number;
  status: 'Pago' | 'Pendente' | 'Vencido' | 'Cancelado' | 'a Vencer';
  data: string;
  data_pagamento: string | null;
  vencimento: string;
  os: string | null; // Adicionado OS
  n_fiscal: string | null; // Adicionado NF
}
// ... (outras interfaces e funções como antes) ...
interface Despesa {
    id: number;
    valor_total: number;
    data: string;
    placa_veiculo: string;
}

interface Veiculo {
    placa: string;
}

interface ResumoVeiculo {
    placa: string;
    totalAReceber: number;
    despesas: number;
}

// Função para formatar moeda (mantém-se igual)
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- CORREÇÃO DE FUSO HORÁRIO --- (mantém-se igual)
const parseDateStringAsLocal = (dateString: string | null | Date): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const date = new Date(`${dateString}T00:00:00`);
    return isValid(date) ? date : null;
}

// *** NOVA FUNÇÃO para determinar o Status *** (mantém-se igual)
const getStatusServico = (servico: Servico, today: Date): 'Cancelado' | 'Pago' | 'a Vencer' | 'Vencido' => {
    if (servico.status === 'Cancelado') {
        return 'Cancelado';
    }
    if (servico.status === 'Pago') {
        return 'Pago';
    }
    const vencimentoDate = parseDateStringAsLocal(servico.vencimento);
    if (vencimentoDate && isBefore(today, vencimentoDate)) {
        return 'a Vencer';
    }
    return 'Vencido';
};


const Dashboard = () => {
    // ... (estados existentes - mantêm-se iguais) ...
    const [summary, setSummary] = useState({
        totalRecebido: 0,
        totalAReceber: 0,
        despesas: 0,
        valorLiquido: 0,
    });
    const [resumoPorVeiculo, setResumoPorVeiculo] = useState<ResumoVeiculo[]>([]);
    const [previsaoRecebimento, setPrevisaoRecebimento] = useState<{periodo: string, valor: number}[]>([]);
    const [previsaoPorVeiculo, setPrevisaoPorVeiculo] = useState<Record<string, {periodo: string, valor: number}[]>>({});
    const [servicosPendentes, setServicosPendentes] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [monthOptions, setMonthOptions] = useState<{ value: string; label: string; }[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
    const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string; }[]>([]);

    useEffect(() => {
        const fetchDataAndCalculate = async () => {
            setLoading(true);
            setError(null);

             // Garantir que 'os' e 'n_fiscal' estão selecionados (o '*' já faz isso, mas podemos ser explícitos)
            const [servicosResponse, despesasResponse, veiculosResponse] = await Promise.all([
                supabase.from('servicos').select('id, cliente, placa_veiculo, valor_bruto, status, data, data_pagamento, vencimento, os, n_fiscal'), // Explicitamente buscar os e n_fiscal
                supabase.from('despesas').select('id, valor_total, data, placa_veiculo'),
                supabase.from('veiculos').select('placa')
            ]);

            // ... (restante da lógica do useEffect permanece igual) ...
            if (servicosResponse.error || despesasResponse.error || veiculosResponse.error) {
                console.error("Erro ao buscar dados:", servicosResponse.error || despesasResponse.error || veiculosResponse.error);
                setError("Não foi possível carregar os dados do dashboard.");
                setLoading(false);
                return;
            }

            const allServicos: Servico[] = servicosResponse.data || [];
            const allDespesas: Despesa[] = despesasResponse.data || [];
            const allVeiculos: Veiculo[] = veiculosResponse.data || [];

             // Popula as opções de meses
            const dates = [...allServicos.map(s => s.data), ...allDespesas.map(d => d.data)];
            const validDates = dates.filter((d): d is string => typeof d === 'string' && d.length > 0);
             const uniqueMonths = [...new Set(validDates.map(d => {
                try {
                    return format(parseISO(d), 'yyyy-MM');
                } catch (e) {
                    console.error("Error parsing date for month options:", d, e);
                    return null;
                }
            }))].filter((m): m is string => m !== null);

            const options = uniqueMonths.sort().reverse().map(monthStr => {
                 try {
                     return {
                         value: monthStr,
                         label: format(parseISO(`${monthStr}-01`), "MMMM 'de' yyyy", { locale: ptBR })
                     };
                 } catch(e) {
                     console.error("Error formatting month label:", monthStr, e);
                     return { value: monthStr, label: 'Erro Data' };
                 }
            });
            setMonthOptions(options);

            // Popula as opções de veículos
            const vehicleOpts = allVeiculos.map(v => ({ value: v.placa, label: v.placa }));
            setVehicleOptions(vehicleOpts);

            // Filtra por mês
            const servicos = selectedMonth === 'all'
                ? allServicos
                : allServicos.filter(s => s.data && s.data.startsWith(selectedMonth));

            const despesas = selectedMonth === 'all'
                ? allDespesas
                : allDespesas.filter(d => d.data && d.data.startsWith(selectedMonth));

            // Cálculos do resumo
            const totalRecebido = servicos
                .filter(s => s.status === 'Pago')
                .reduce((acc, s) => acc + s.valor_bruto, 0);

            const totalAReceber = servicos
                .filter(s => s.status === 'Pendente' || s.status === 'Vencido')
                .reduce((acc, s) => acc + s.valor_bruto, 0);

            const despesasTotal = despesas.reduce((acc, d) => acc + d.valor_total, 0);

            setSummary({
                totalRecebido,
                totalAReceber,
                despesas: despesasTotal,
                valorLiquido: totalRecebido - despesasTotal
            });

            // Resumo por veículo
             const resumoVeiculos = allVeiculos.map(veiculo => {
                const totalAReceberVeiculo = servicos
                    .filter(s => s.placa_veiculo === veiculo.placa && (s.status === 'Pendente' || s.status === 'Vencido'))
                    .reduce((acc, s) => acc + s.valor_bruto, 0);

                const despesasVeiculo = despesas
                    .filter(d => d.placa_veiculo === veiculo.placa)
                    .reduce((acc, d) => acc + d.valor_total, 0);

                return {
                    placa: veiculo.placa,
                    totalAReceber: totalAReceberVeiculo,
                    despesas: despesasVeiculo
                };
            }).filter(v => v.totalAReceber > 0 || v.despesas > 0);
            setResumoPorVeiculo(resumoVeiculos);

            // Filtra serviços pendentes por mês E por veículo selecionado
            const today = new Date();
            const pendentesGeral = allServicos
                .map(s => ({ ...s, status: getStatusServico(s, today) }))
                .filter(s => s.status === 'Pendente' || s.status === 'Vencido' || s.status === 'a Vencer');

            const pendentesFiltrados = pendentesGeral
                .filter(s =>
                    (selectedMonth === 'all' || (s.data && s.data.startsWith(selectedMonth))) &&
                    (selectedVehicle === 'all' || s.placa_veiculo === selectedVehicle)
                )
                .sort((a, b) => {
                     const dateA = parseDateStringAsLocal(a.vencimento);
                    const dateB = parseDateStringAsLocal(b.vencimento);
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA.getTime() - dateB.getTime();
                });


            setServicosPendentes(pendentesFiltrados);

             // Previsão de recebimento
            const periodos = [
                { label: 'Próximos 7 dias', start: today, end: addDays(today, 7) },
                { label: 'Próximos 15 dias', start: addDays(today, 8), end: addDays(today, 15) },
                { label: 'Próximos 30 dias', start: addDays(today, 16), end: addDays(today, 30) },
            ];

            const previsao = periodos.map(p => {
                const valor = pendentesGeral
                    .filter(s => {
                        const vencimentoDate = parseDateStringAsLocal(s.vencimento);
                        return vencimentoDate && (s.status === 'a Vencer' || s.status === 'Pendente') && isWithinInterval(vencimentoDate, { start: p.start, end: p.end });
                    })
                    .reduce((acc, s) => acc + s.valor_bruto, 0);
                return { periodo: p.label, valor };
            });
            setPrevisaoRecebimento(previsao);

            // Previsão por Veículo
            const veiculosComPendencias = [...new Set(pendentesGeral.map(s => s.placa_veiculo))];
            const previsaoVeiculos: Record<string, {periodo: string, valor: number}[]> = {};

            veiculosComPendencias.forEach(placa => {
                const servicosDoVeiculo = pendentesGeral.filter(s => s.placa_veiculo === placa);
                previsaoVeiculos[placa] = periodos.map(p => {
                    const valor = servicosDoVeiculo
                        .filter(s => {
                            const vencimentoDate = parseDateStringAsLocal(s.vencimento);
                            return vencimentoDate && (s.status === 'a Vencer' || s.status === 'Pendente') && isWithinInterval(vencimentoDate, { start: p.start, end: p.end });
                        })
                        .reduce((acc, s) => acc + s.valor_bruto, 0);
                    return { periodo: p.label, valor };
                });
            });
            setPrevisaoPorVeiculo(previsaoVeiculos);

            setLoading(false);
        };

        fetchDataAndCalculate();
    }, [selectedMonth, selectedVehicle]);


    const summaryLabel = selectedMonth === 'all' ? '(Geral)' : `(${format(parseISO(`${selectedMonth}-01`), "MMM/yy", { locale: ptBR })})`;

    const handlePrint = () => { window.print(); };

    if (loading) return <p>A carregar dashboard...</p>
    if (error) return <p className="text-destructive">{error}</p>

    return (
      <div className="space-y-6 printable-container">
        {/* ... (Header and Summary/Forecast Cards remain the same) ... */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print-hide">
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
         <div className="grid gap-6 md:grid-cols-2 print-hide">
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
                          <TableCell className="font-medium">Total a Receber {summaryLabel}</TableCell>
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
                   <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>Detalhes por Veículo {summaryLabel}</AccordionTrigger>
                      <AccordionContent>
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead>Veículo</TableHead>
                              <TableHead className="text-right">A Receber</TableHead>
                              <TableHead className="text-right">Despesas</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                          {resumoPorVeiculo.map(veiculo => (
                              <TableRow key={veiculo.placa}>
                              <TableCell className="font-medium">{veiculo.placa}</TableCell>
                              <TableCell className="text-right">{formatCurrency(veiculo.totalAReceber)}</TableCell>
                              <TableCell className="text-right text-destructive">{formatCurrency(veiculo.despesas)}</TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                      </AccordionContent>
                  </AccordionItem>
                  </Accordion>
              </CardContent>
          </Card>
          <Card>
               <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Previsão de Recebimento (Geral)
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
                  <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>Detalhes por Veículo</AccordionTrigger>
                      <AccordionContent>
                      {Object.entries(previsaoPorVeiculo).map(([placa, previsao]) => (
                          <div key={placa} className="mb-4">
                          <h4 className="font-semibold mb-2">{placa}</h4>
                          <Table>
                              <TableBody>
                              {previsao.map((item, index) => (
                                  <TableRow key={index}>
                                  <TableCell className="font-medium">{item.periodo}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                                  </TableRow>
                              ))}
                              </TableBody>
                          </Table>
                          </div>
                      ))}
                      </AccordionContent>
                  </AccordionItem>
                  </Accordion>
              </CardContent>
          </Card>
        </div>
  
        <Card id="servicos-pendentes-card">
          {/* CardHeader remains the same */}
          <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print-hide">
                  <CardTitle className="text-lg flex items-center gap-2 mb-2 sm:mb-0">
                      <FileText className="h-5 w-5" />
                      Serviços Pendentes de Pagamento {summaryLabel}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                      <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                          <SelectTrigger className="w-full sm:w-[220px]">
                              <SelectValue placeholder="Filtrar por veículo" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos os Veículos</SelectItem>
                              {vehicleOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir Lista">
                          <Printer className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dias Venc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicosPendentes.map((servico) => {
                  const vencimentoDate = parseDateStringAsLocal(servico.vencimento);
                  const today = new Date();
                  const diasVencidos = servico.status === 'Vencido' && vencimentoDate
                    ? differenceInDays(today, vencimentoDate)
                    : null;
  
                  return (
                      // Adicionar a classe condicional aqui
                      <TableRow
                          key={servico.id}
                          className={cn(servico.status === 'Vencido' ? 'text-destructive' : '')}
                      >
                          <TableCell>{servico.os || '-'}</TableCell>
                          <TableCell>{servico.n_fiscal || '-'}</TableCell>
                          <TableCell>{servico.cliente}</TableCell>
                          <TableCell>{servico.placa_veiculo}</TableCell>
                          <TableCell>{formatCurrency(servico.valor_bruto)}</TableCell>
                          <TableCell>
                              {vencimentoDate ? format(vencimentoDate, 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          {/* Aplicar negrito ao status se estiver vencido */}
                          <TableCell className={cn(servico.status === 'Vencido' ? 'font-bold' : '')}>{servico.status}</TableCell>
                           {/* Manter a classe na célula de dias vencidos */}
                          <TableCell className={cn(diasVencidos !== null && diasVencidos > 0 ? 'font-medium' : '')}>
                              {diasVencidos !== null && diasVencidos > 0 ? diasVencidos : '-'}
                          </TableCell>
                      </TableRow>
                  );
                })}
                {servicosPendentes.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum serviço pendente encontrado para os filtros selecionados.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default Dashboard;