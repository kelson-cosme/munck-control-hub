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

const despesas = [
  { data: "10/01/2024", veiculo: "MRC-1234", fornecedor: "Posto Combustível ABC", descricao: "Abastecimento", valor: "R$ 450,00", vencimento: "10/01/2024", status: "Pago" },
  { data: "08/01/2024", veiculo: "MRC-5678", fornecedor: "Oficina São José", descricao: "Troca de óleo", valor: "R$ 280,00", vencimento: "15/01/2024", status: "Pendente" },
  { data: "05/01/2024", veiculo: "MRC-9012", fornecedor: "Pneus e Cia", descricao: "4 pneus novos", valor: "R$ 1.200,00", vencimento: "20/01/2024", status: "Pendente" },
  { data: "03/01/2024", veiculo: "MRC-3456", fornecedor: "Mecânica Central", descricao: "Reparo no freio", valor: "R$ 650,00", vencimento: "03/01/2024", status: "Pago" },
  { data: "01/01/2024", veiculo: "MRC-1234", fornecedor: "Seguradora XYZ", descricao: "Seguro anual", valor: "R$ 3.500,00", vencimento: "01/01/2024", status: "Pago" },
];

const Despesas = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDespesas = despesas.filter((despesa) => 
    despesa.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    despesa.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manutenção / Despesas</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por veículo, fornecedor ou descrição..."
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
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDespesas.map((despesa, index) => (
                <TableRow key={index}>
                  <TableCell>{despesa.data}</TableCell>
                  <TableCell className="font-medium">{despesa.veiculo}</TableCell>
                  <TableCell>{despesa.fornecedor}</TableCell>
                  <TableCell>{despesa.descricao}</TableCell>
                  <TableCell>{despesa.valor}</TableCell>
                  <TableCell>{despesa.vencimento}</TableCell>
                  <TableCell>{despesa.status}</TableCell>
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

export default Despesas;