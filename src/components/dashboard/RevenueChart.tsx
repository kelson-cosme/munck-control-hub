import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { period: "01-05", valor: 15000 },
  { period: "06-10", valor: 22000 },
  { period: "11-15", valor: 18500 },
  { period: "16-20", valor: 27000 },
  { period: "21-25", valor: 19500 },
  { period: "26-31", valor: 31000 },
];

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Recebimento - Próximos 30 dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, "Valor"]}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}