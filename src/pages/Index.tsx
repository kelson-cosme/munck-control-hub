import { 
  DollarSign, 
  TrendingUp,
  Calculator,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const resumoFinanceiro = [
  { item: "Total Recebido (Mês)", valor: "R$ 85.420,00" },
  { item: "Total a Receber", valor: "R$ 42.850,00" },
  { item: "Despesas Realizadas", valor: "R$ 18.100,00" },
  { item: "Valor Líquido", valor: "R$ 67.320,00" },
];

const previsaoRecebimento = [
  { periodo: "01 a 05 de Janeiro", valor: "R$ 15.000,00" },
  { periodo: "06 a 10 de Janeiro", valor: "R$ 22.000,00" },
  { periodo: "11 a 15 de Janeiro", valor: "R$ 18.500,00" },
  { periodo: "16 a 20 de Janeiro", valor: "R$ 27.000,00" },
  { periodo: "21 a 25 de Janeiro", valor: "R$ 19.500,00" },
  { periodo: "26 a 31 de Janeiro", valor: "R$ 31.000,00" },
];

const servicosPendentes = [
  { os: "OS-001", cliente: "Construtora ABC", veiculo: "MRC-1234", valor: "R$ 2.500,00", vencimento: "15/01/2024" },
  { os: "OS-003", cliente: "Metalúrgica Industrial", veiculo: "MRC-9012", valor: "R$ 3.200,00", vencimento: "20/01/2024" },
  { os: "OS-005", cliente: "Obras Especiais", veiculo: "MRC-5678", valor: "R$ 1.800,00", vencimento: "25/01/2024" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard - Sistema de Gestão Munck</h1>
        <p className="text-muted-foreground">Resumo financeiro e operacional</p>
      </div>

      {/* Resumo Financeiro */}
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
                {resumoFinanceiro.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell className="text-right">{item.valor}</TableCell>
                  </TableRow>
                ))}
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
                    <TableCell className="text-right">{item.valor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Serviços Pendentes */}
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
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicosPendentes.map((servico, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{servico.os}</TableCell>
                  <TableCell>{servico.cliente}</TableCell>
                  <TableCell>{servico.veiculo}</TableCell>
                  <TableCell>{servico.valor}</TableCell>
                  <TableCell>{servico.vencimento}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
