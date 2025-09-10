import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Printer } from "lucide-react";

const Relatorios = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Mensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Consolidado completo do mês com serviços, despesas e comissões
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Veículos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Listagem completa da frota com status e manutenções
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Receitas, despesas e demonstrativo de resultados
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Motoristas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Comissões calculadas e descontos por motorista
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Pendências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Contas a receber e pagar em aberto
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Manutenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Histórico de manutenções e despesas por veículo
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;