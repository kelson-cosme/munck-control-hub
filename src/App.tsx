import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Veiculos from "./pages/Veiculos";
import VeiculoDetalhes from "./pages/VeiculoDetalhes";
// Servicos e Despesas foram removidos das importações
import Motoristas from "./pages/Motoristas";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import RelatorioMensal from "./pages/RelatorioMensal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/veiculos/:placa" element={<VeiculoDetalhes />} />
            {/* As rotas para /servicos e /despesas foram removidas */}
            <Route path="/motoristas" element={<Motoristas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/relatorios/mensal" element={<RelatorioMensal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;