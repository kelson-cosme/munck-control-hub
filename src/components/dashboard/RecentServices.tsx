import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentServices = [
  {
    id: "OS-001",
    cliente: "Construtora ABC Ltda",
    veiculo: "MRC-1234",
    valor: 2500,
    status: "Pendente",
    vencimento: "2024-01-15",
  },
  {
    id: "OS-002", 
    cliente: "Obras & Construções SA",
    veiculo: "MRC-5678",
    valor: 1800,
    status: "Pago",
    vencimento: "2024-01-12",
  },
  {
    id: "OS-003",
    cliente: "Metalúrgica Industrial",
    veiculo: "MRC-9012",
    valor: 3200,
    status: "Pendente",
    vencimento: "2024-01-20",
  },
  {
    id: "OS-004",
    cliente: "Construtora XYZ",
    veiculo: "MRC-3456",
    valor: 1500,
    status: "Vencido",
    vencimento: "2024-01-08",
  },
];

export function RecentServices() {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pago":
        return "success";
      case "Pendente":
        return "warning";
      case "Vencido":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentServices.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">{service.cliente}</p>
                <p className="text-xs text-muted-foreground">
                  {service.id} • {service.veiculo}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vencimento: {new Date(service.vencimento).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium">
                  R$ {service.valor.toLocaleString()}
                </p>
                <Badge variant={getStatusVariant(service.status) as any} className="text-xs">
                  {service.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}