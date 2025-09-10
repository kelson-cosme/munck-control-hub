import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const veiculos = [
  {
    id: 1,
    placa: "MRC-1234",
    modelo: "Mercedes-Benz Atego 1719",
    ano: 2020,
    status: "ativo",
    ultimaManutencao: "2024-01-10",
  },
  {
    id: 2,
    placa: "MRC-5678",
    modelo: "Volvo VM 220",
    ano: 2019,
    status: "ativo",
    ultimaManutencao: "2024-01-05",
  },
  {
    id: 3,
    placa: "MRC-9012",
    modelo: "Scania P 280",
    ano: 2021,
    status: "manutencao",
    ultimaManutencao: "2024-01-08",
  },
  {
    id: 4,
    placa: "MRC-3456",
    modelo: "Ford Cargo 1719",
    ano: 2018,
    status: "inativo",
    ultimaManutencao: "2023-12-20",
  },
];

const Veiculos = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ativo":
        return "success";
      case "manutencao":
        return "warning";
      case "inativo":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "manutencao":
        return "Manutenção";
      case "inativo":
        return "Inativo";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie sua frota de caminhões Munck
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
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
                <TableHead>Última Manutenção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell className="font-medium">{veiculo.placa}</TableCell>
                  <TableCell>{veiculo.modelo}</TableCell>
                  <TableCell>{veiculo.ano}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(veiculo.status) as any}>
                      {getStatusLabel(veiculo.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(veiculo.ultimaManutencao).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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