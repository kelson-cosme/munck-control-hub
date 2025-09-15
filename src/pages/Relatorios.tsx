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

      const faturamentoBruto = servicos.filter(s => s.status !== 'Cancelado').reduce((acc, s) => acc + s.valor_bruto, 0);
      const totalDespesas = despesas.reduce((acc, d) => acc + d.valor_total, 0);
      const saldo = faturamentoBruto - totalDespesas;

      const [year, monthStr] = selectedMonth.split('-');
      const period = format(new Date(Number(year), Number(monthStr) - 1), 'MMMM_yyyy', { locale: ptBR });
      const fileName = `Relatorio_Mensal_${period}`;

      if (formatType === 'excel') {
        generateExcel(fileName, { servicos, despesas, faturamentoBruto, totalDespesas, saldo });
      } else {
        generatePdf(fileName, { servicos, despesas, faturamentoBruto, totalDespesas, saldo });
      }
    } catch (error) {
      console.error(`Erro ao gerar relatório ${formatType}:`, error);
      alert(`Não foi possível gerar o relatório. Verifique o console para mais detalhes.`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExcel = (fileName: string, data: { servicos: Servico[], despesas: Despesa[], faturamentoBruto: number, totalDespesas: number, saldo: number }) => {
      const summaryData = [
        { "Item": "Faturamento Bruto", "Valor": data.faturamentoBruto },
        { "Item": "Total de Despesas", "Valor": data.totalDespesas },
        { "Item": "Saldo", "Valor": data.saldo },
      ];
      
      const servicosData = data.servicos.map(s => ({
        "Data": format(new Date(s.data + 'T00:00:00'), 'dd/MM/yyyy'), "Cliente": s.cliente, "Veículo": s.placa_veiculo, "Status": s.status, "Valor Bruto": s.valor_bruto
      }));

      const despesasData = data.despesas.map(d => ({
        "Data": format(new Date(d.data + 'T00:00:00'), 'dd/MM/yyyy'), "Veículo": d.placa_veiculo, "Fornecedor": d.fornecedor, "Descrição": d.descricao, "Valor": d.valor_total
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsServicos = XLSX.utils.json_to_sheet(servicosData);
      const wsDespesas = XLSX.utils.json_to_sheet(despesasData);

      wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
      wsServicos['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      wsDespesas['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
      XLSX.utils.book_append_sheet(wb, wsServicos, "Serviços");
      XLSX.utils.book_append_sheet(wb, wsDespesas, "Despesas");

      XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const generatePdf = (fileName: string, data: { servicos: Servico[], despesas: Despesa[], faturamentoBruto: number, totalDespesas: number, saldo: number }) => {
      const doc = new jsPDF();
      const [year, monthStr] = selectedMonth.split('-');
      const monthName = format(new Date(Number(year), Number(monthStr) - 1), 'MMMM', { locale: ptBR });
      const title = `Relatório Mensal - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;

      doc.setFontSize(18);
      doc.text(title, 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Faturamento Bruto: ${formatCurrency(data.faturamentoBruto)}`, 14, 32);
      doc.text(`Total de Despesas: ${formatCurrency(data.totalDespesas)}`, 14, 38);
      doc.text(`Saldo: ${formatCurrency(data.saldo)}`, 14, 44);

      autoTable(doc, {
          startY: 55,
          head: [['Data', 'Cliente', 'Veículo', 'Status', 'Valor Bruto']],
          body: data.servicos.map(s => [
              format(new Date(s.data + 'T00:00:00'), 'dd/MM/yyyy'), s.cliente, s.placa_veiculo, s.status, formatCurrency(s.valor_bruto)
          ]),
          headStyles: { fillColor: '#10523C' }
      });

      autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['Data', 'Veículo', 'Fornecedor', 'Descrição', 'Valor']],
          body: data.despesas.map(d => [
              format(new Date(d.data + 'T00:00:00'), 'dd/MM/yyyy'), d.placa_veiculo, d.fornecedor, d.descricao, formatCurrency(d.valor_total)
          ]),
          headStyles: { fillColor: '#10523C' }
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