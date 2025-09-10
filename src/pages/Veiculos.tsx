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

const veiculos = [
  { placa: "MRC-1234", modelo: "Mercedes-Benz Atego 1719", ano: 2020, status: "Ativo" },
  { placa: "MRC-5678", modelo: "Volvo VM 220", ano: 2019, status: "Ativo" },
  { placa: "MRC-9012", modelo: "Scania P 280", ano: 2021, status: "Manutenção" },
  { placa: "MRC-3456", modelo: "Ford Cargo 1719", ano: 2018, status: "Inativo" },
  { placa: "MRC-7890", modelo: "Mercedes-Benz Atego 2426", ano: 2022, status: "Ativo" },
];

const Veiculos = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro de Veículos</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por placa ou modelo..."
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
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.map((veiculo, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{veiculo.placa}</TableCell>
                  <TableCell>{veiculo.modelo}</TableCell>
                  <TableCell>{veiculo.ano}</TableCell>
                  <TableCell>{veiculo.status}</TableCell>
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

export default Veiculos;