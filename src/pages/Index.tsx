import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CreditCard,
  Calendar,
  Users
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentServices } from "@/components/dashboard/RecentServices";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio de locação de Munck
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Recebido (Mês)"
          value="R$ 85.420"
          icon={<DollarSign />}
          variant="success"
          trend={{ value: "12%", isPositive: true }}
        />
        <MetricCard
          title="Total a Receber"
          value="R$ 42.850"
          icon={<CreditCard />}
          variant="warning"
          trend={{ value: "8%", isPositive: false }}
        />
        <MetricCard
          title="Serviços Pendentes"
          value="23"
          icon={<AlertCircle />}
          variant="destructive"
        />
        <MetricCard
          title="Valor Líquido"
          value="R$ 67.320"
          icon={<TrendingUp />}
          variant="success"
          trend={{ value: "15%", isPositive: true }}
        />
      </div>

      {/* Gráfico de previsão e serviços recentes */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart />
        </div>
        <div className="lg:col-span-3">
          <RecentServices />
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Despesas Realizadas (Mês)"
          value="R$ 18.100"
          icon={<Calendar />}
          variant="destructive"
        />
        <MetricCard
          title="Comissões a Pagar"
          value="R$ 9.680"
          icon={<Users />}
          variant="warning"
        />
      </div>
    </div>
  );
};

export default Dashboard;
