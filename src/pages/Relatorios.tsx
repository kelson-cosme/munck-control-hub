import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipagem dos dados
type Servico = { data: string; cliente: string; placa_veiculo: string; status: string; valor_bruto: number; };
type Despesa = { data: string; descricao: string; fornecedor: string; placa_veiculo: string; valor_total: number; };

// Função para formatar valores em Reais
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Relatorios = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Gera as opções de meses para o seletor
  useEffect(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const value = format(date, 'yyyy-MM');
        const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
        options.push({ value, label });
    }
    setMonthOptions(options);
  }, []);

  // Função centralizada para buscar os dados do relatório
  const fetchReportData = async (month: string): Promise<{ servicos: Servico[], despesas: Despesa[] }> => {
    if (!month) {
      throw new Error("Por favor, selecione um mês válido.");
    }
    const [year, monthStr] = month.split('-');
    const startDate = format(startOfMonth(new Date(Number(year), Number(monthStr) - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(Number(year), Number(monthStr) - 1)), 'yyyy-MM-dd');

    const { data: servicos, error: servicosError } = await supabase
      .from('servicos')
      .select('data, cliente, placa_veiculo, status, valor_bruto')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });
    if (servicosError) throw servicosError;

    const { data: despesas, error: despesasError } = await supabase
      .from('despesas')
      .select('data, descricao, fornecedor, placa_veiculo, valor_total')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });
    if (despesasError) throw despesasError;

    return { servicos: servicos || [], despesas: despesas || [] };
  }

  const handleGenerateReport = async (formatType: 'excel' | 'pdf') => {
    setIsLoading(true);
    try {
      const { servicos, despesas } = await fetchReportData(selectedMonth);

      // Agrupa dados por veículo
      const plates = [...new Set([...servicos.map(s => s.placa_veiculo), ...despesas.map(d => d.placa_veiculo)])];
      const dataByVehicle = plates.map(placa => {
          const servicosDoVeiculo = servicos.filter(s => s.placa_veiculo === placa);
          const despesasDoVeiculo = despesas.filter(d => d.placa_veiculo === placa);
          const faturamento = servicosDoVeiculo.filter(s => s.status !== 'Cancelado').reduce((acc, s) => acc + s.valor_bruto, 0);
          const totalDespesas = despesasDoVeiculo.reduce((acc, d) => acc + d.valor_total, 0);
          return {
              placa,
              servicos: servicosDoVeiculo,
              despesas: despesasDoVeiculo,
              faturamento,
              totalDespesas,
              saldo: faturamento - totalDespesas
          };
      });

      // Cálculos gerais
      const faturamentoBruto = dataByVehicle.reduce((acc, v) => acc + v.faturamento, 0);
      const totalDespesasGeral = dataByVehicle.reduce((acc, v) => acc + v.totalDespesas, 0);
      const comissaoMauri = faturamentoBruto * 0.01;
      const saldoGeral = faturamentoBruto - totalDespesasGeral - comissaoMauri;

      const [year, monthStr] = selectedMonth.split('-');
      const period = format(new Date(Number(year), Number(monthStr) - 1), 'MMMM_yyyy', { locale: ptBR });
      const fileName = `Relatorio_Mensal_${period}`;

      const reportPayload = { servicos, despesas, dataByVehicle, faturamentoBruto, totalDespesasGeral, saldoGeral, comissaoMauri };

      if (formatType === 'excel') {
        generateExcel(fileName, reportPayload);
      } else {
        generatePdf(fileName, reportPayload);
      }
    } catch (error) {
      console.error(`Erro ao gerar relatório ${formatType}:`, error);
      alert(`Não foi possível gerar o relatório. Verifique o console para mais detalhes.`);
    } finally {
      setIsLoading(false);
    }
  };

  type ReportPayload = {
    servicos: Servico[], despesas: Despesa[], dataByVehicle: any[], faturamentoBruto: number, totalDespesasGeral: number, saldoGeral: number, comissaoMauri: number
  };

  const generateExcel = (fileName: string, data: ReportPayload) => {
      const summaryData = [
        { "Item": "Faturamento Bruto", "Valor": data.faturamentoBruto },
        { "Item": "Total de Despesas", "Valor": data.totalDespesasGeral },
        { "Item": "Comissão Mauri (1%)", "Valor": data.comissaoMauri },
        { "Item": "Saldo Líquido", "Valor": data.saldoGeral },
      ];

      const vehicleSummaryData = data.dataByVehicle.map(v => ({
        "Veículo": v.placa,
        "Faturamento": v.faturamento,
        "Despesas": v.totalDespesas,
        "Saldo": v.saldo
      }));
      
      const servicosData = data.servicos.map(s => ({
        "Data": format(new Date(s.data + 'T00:00:00'), 'dd/MM/yyyy'), "Cliente": s.cliente, "Veículo": s.placa_veiculo, "Status": s.status, "Valor Bruto": s.valor_bruto
      }));

      const despesasData = data.despesas.map(d => ({
        "Data": format(new Date(d.data + 'T00:00:00'), 'dd/MM/yyyy'), "Veículo": d.placa_veiculo, "Fornecedor": d.fornecedor, "Descrição": d.descricao, "Valor": d.valor_total
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsVehicleSummary = XLSX.utils.json_to_sheet(vehicleSummaryData);
      const wsServicos = XLSX.utils.json_to_sheet(servicosData);
      const wsDespesas = XLSX.utils.json_to_sheet(despesasData);

      wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
      wsVehicleSummary['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      wsServicos['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      wsDespesas['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Geral");
      XLSX.utils.book_append_sheet(wb, wsVehicleSummary, "Resumo por Veículo");
      XLSX.utils.book_append_sheet(wb, wsServicos, "Serviços (Todos)");
      XLSX.utils.book_append_sheet(wb, wsDespesas, "Despesas (Todas)");

      XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const generatePdf = (fileName: string, data: ReportPayload) => {
      const doc = new jsPDF();
      const [year, monthStr] = selectedMonth.split('-');
      const monthName = format(new Date(Number(year), Number(monthStr) - 1), 'MMMM', { locale: ptBR });
      const title = `Relatório Mensal - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
      let finalY = 0;

      // Cabeçalho Geral
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      // Resumo Geral
      doc.setFontSize(11);
      doc.setTextColor(100);
      const summaryYStart = 32;
      doc.text(`Faturamento Bruto Total: ${formatCurrency(data.faturamentoBruto)}`, 14, summaryYStart);
      doc.text(`Total de Despesas: ${formatCurrency(data.totalDespesasGeral)}`, 14, summaryYStart + 6);
      doc.text(`Comissão Mauri (1%): ${formatCurrency(data.comissaoMauri)}`, 14, summaryYStart + 12);
      doc.setFontSize(12);
      doc.text(`Saldo Líquido Total: ${formatCurrency(data.saldoGeral)}`, 14, summaryYStart + 20);
      finalY = summaryYStart + 25;

      // Loop por veículo
      data.dataByVehicle.forEach(vehicleData => {
          finalY += 15; // Espaço antes de cada veículo
          
          // Subtítulo do Veículo
          doc.setFontSize(16);
          doc.setTextColor(0);
          doc.text(`Veículo: ${vehicleData.placa}`, 14, finalY);
          
          // Resumo do Veículo
          doc.setFontSize(10);
          doc.setTextColor(100);
          finalY += 7;
          doc.text(`Faturamento: ${formatCurrency(vehicleData.faturamento)}`, 16, finalY);
          doc.text(`Despesas: ${formatCurrency(vehicleData.totalDespesas)}`, 70, finalY);
          doc.text(`Saldo: ${formatCurrency(vehicleData.saldo)}`, 120, finalY);
          finalY += 5;

          // Tabela de Serviços do Veículo
          if(vehicleData.servicos.length > 0) {
              autoTable(doc, {
                  startY: finalY,
                  head: [['Data', 'Cliente', 'Status', 'Valor Bruto']],
                  body: vehicleData.servicos.map((s: Servico) => [
                      format(new Date(s.data + 'T00:00:00'), 'dd/MM/yyyy'), s.cliente, s.status, formatCurrency(s.valor_bruto)
                  ]),
                  headStyles: { fillColor: '#10523C' },
                  theme: 'grid'
              });
              finalY = (doc as any).lastAutoTable.finalY;
          }

          // Tabela de Despesas do Veículo
          if(vehicleData.despesas.length > 0) {
              autoTable(doc, {
                  startY: finalY + 2,
                  head: [['Data', 'Fornecedor', 'Descrição', 'Valor']],
                  body: vehicleData.despesas.map((d: Despesa) => [
                      format(new Date(d.data + 'T00:00:00'), 'dd/MM/yyyy'), d.fornecedor, d.descricao, formatCurrency(d.valor_total)
                  ]),
                  headStyles: { fillColor: '#4A5568' },
                  theme: 'grid'
              });
              finalY = (doc as any).lastAutoTable.finalY;
          }
      });
      
      doc.save(`${fileName}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Mensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Consolidado completo do mês com serviços e despesas.
            </p>
            
            <div>
              <Label htmlFor="month-select" className="text-sm font-medium">Mês</Label>
               <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full mt-1" id="month-select">
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

            <div>
              <Label className="text-sm font-medium">Gerar Arquivos</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={() => handleGenerateReport('excel')} disabled={isLoading}>
                  <FileDown className="h-4 w-4 mr-2" />
                  {isLoading ? 'Gerando...' : 'Excel'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleGenerateReport('pdf')} disabled={isLoading}>
                  <Printer className="h-4 w-4 mr-2" />
                  {isLoading ? 'Gerando...' : 'PDF'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Veículos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Listagem completa da frota com status e manutenções.
            </p>
             <Button variant="outline" disabled>Gerar Relatório</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Relatorios;