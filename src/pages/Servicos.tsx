import { useState } from "react";
import { Plus, Search } from "lucide-react";
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

const servicos = [
  { os: "OS-001", data: "12/01/2024", cliente: "Construtora ABC Ltda", veiculo: "MRC-1234", operador: "João Silva", valorBruto: "R$ 2.500,00", valorLiquido: "R$ 2.200,00", formaPagamento: "PIX", vencimento: "15/01/2024", status: "Pendente" },
  { os: "OS-002", data: "10/01/2024", cliente: "Obras & Construções SA", veiculo: "MRC-5678", operador: "Carlos Santos", valorBruto: "R$ 1.800,00", valorLiquido: "R$ 1.600,00", formaPagamento: "Boleto", vencimento: "12/01/2024", status: "Pago" },
  { os: "OS-003", data: "08/01/2024", cliente: "Metalúrgica Industrial", veiculo: "MRC-9012", operador: "Ana Costa", valorBruto: "R$ 3.200,00", valorLiquido: "R$ 2.850,00", formaPagamento: "Cartão", vencimento: "20/01/2024", status: "Pendente" },
  { os: "OS-004", data: "05/01/2024", cliente: "Construtora XYZ", veiculo: "MRC-3456", operador: "Pedro Lima", valorBruto: "R$ 1.500,00", valorLiquido: "R$ 1.350,00", formaPagamento: "PIX", vencimento: "08/01/2024", status: "Vencido" },
];

const Servicos = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServicos = servicos.filter((servico) => 
    servico.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.veiculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços Realizados</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por OS, cliente ou veículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Valor Líquido</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicos.map((servico, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{servico.os}</TableCell>
                  <TableCell>{servico.data}</TableCell>
                  <TableCell>{servico.cliente}</TableCell>
                  <TableCell>{servico.veiculo}</TableCell>
                  <TableCell>{servico.operador}</TableCell>
                  <TableCell>{servico.valorBruto}</TableCell>
                  <TableCell>{servico.valorLiquido}</TableCell>
                  <TableCell>{servico.formaPagamento}</TableCell>
                  <TableCell>{servico.vencimento}</TableCell>
                  <TableCell>{servico.status}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Servicos;