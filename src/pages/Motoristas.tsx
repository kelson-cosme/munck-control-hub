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

const motoristas = [
  { nome: "João Silva", comissao: "15%", faturamentoMes: "R$ 12.500,00", comissaoCalculada: "R$ 1.875,00", descontos: "R$ 350,00", valorFinal: "R$ 1.525,00" },
  { nome: "Carlos Santos", comissao: "12%", faturamentoMes: "R$ 8.900,00", comissaoCalculada: "R$ 1.068,00", descontos: "R$ 200,00", valorFinal: "R$ 868,00" },
  { nome: "Ana Costa", comissao: "18%", faturamentoMes: "R$ 15.200,00", comissaoCalculada: "R$ 2.736,00", descontos: "R$ 450,00", valorFinal: "R$ 2.286,00" },
  { nome: "Pedro Lima", comissao: "10%", faturamentoMes: "R$ 6.800,00", comissaoCalculada: "R$ 680,00", descontos: "R$ 150,00", valorFinal: "R$ 530,00" },
];

const Motoristas = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMotoristas = motoristas.filter((motorista) => 
    motorista.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Controle de Motoristas</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Motorista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por nome..."
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
                <TableHead>Nome</TableHead>
                <TableHead>% Comissão</TableHead>
                <TableHead>Faturamento Mês</TableHead>
                <TableHead>Comissão Calculada</TableHead>
                <TableHead>Descontos</TableHead>
                <TableHead>Valor Final</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMotoristas.map((motorista, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{motorista.nome}</TableCell>
                  <TableCell>{motorista.comissao}</TableCell>
                  <TableCell>{motorista.faturamentoMes}</TableCell>
                  <TableCell>{motorista.comissaoCalculada}</TableCell>
                  <TableCell>{motorista.descontos}</TableCell>
                  <TableCell className="font-medium">{motorista.valorFinal}</TableCell>
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

export default Motoristas;