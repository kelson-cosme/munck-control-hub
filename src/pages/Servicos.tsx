import { useState } from "react";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const servicos = [
  {
    id: 1,
    os: "OS-001",
    data: "2024-01-12",
    cliente: "Construtora ABC Ltda",
    veiculo: "MRC-1234",
    operador: "João Silva",
    valorBruto: 2500,
    valorLiquido: 2200,
    formaPagamento: "PIX",
    vencimento: "2024-01-15",
    status: "pendente",
  },
  {
    id: 2,
    os: "OS-002",
    data: "2024-01-10",
    cliente: "Obras & Construções SA",
    veiculo: "MRC-5678",
    operador: "Carlos Santos",
    valorBruto: 1800,
    valorLiquido: 1600,
    formaPagamento: "Boleto",
    vencimento: "2024-01-12",
    status: "pago",
  },
  {
    id: 3,
    os: "OS-003",
    data: "2024-01-08",
    cliente: "Metalúrgica Industrial",
    veiculo: "MRC-9012",
    operador: "Ana Costa",
    valorBruto: 3200,
    valorLiquido: 2850,
    formaPagamento: "Cartão",
    vencimento: "2024-01-20",
    status: "pendente",
  },
];

const Servicos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredServicos = servicos.filter((servico) => {
    const matchesSearch = 
      servico.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.veiculo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || servico.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pago":
        return "success";
      case "pendente":
        return "warning";
      case "vencido":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago";
      case "pendente":
        return "Pendente";
      case "vencido":
        return "Vencido";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços realizados pela sua frota
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por OS, cliente ou veículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>Valor Líquido</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">{servico.os}</TableCell>
                  <TableCell>
                    {new Date(servico.data).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{servico.cliente}</TableCell>
                  <TableCell>{servico.veiculo}</TableCell>
                  <TableCell>{servico.operador}</TableCell>
                  <TableCell>R$ {servico.valorLiquido.toLocaleString()}</TableCell>
                  <TableCell>{servico.formaPagamento}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(servico.status) as any}>
                      {getStatusLabel(servico.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
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