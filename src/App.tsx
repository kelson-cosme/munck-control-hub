// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout' // Certifique-se que está assim
import Index from './pages/Index'
import Veiculos from './pages/Veiculos'
import VeiculoDetalhes from './pages/VeiculoDetalhes'
import Servicos from './pages/Servicos'
import Despesas from './pages/Despesas'
import Motoristas from './pages/Motoristas'
import Relatorios from './pages/Relatorios'
import RelatorioMensal from './pages/RelatorioMensal'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Perfil from './pages/Perfil' // <--- IMPORTAR A NOVA PÁGINA
import { useAuth } from './contexts/AuthContext'

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        A carregar...
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Rotas protegidas dentro do AppLayout */}
      <Route path="/" element={<AppLayout><Index /></AppLayout>} />
      <Route path="/veiculos" element={<AppLayout><Veiculos /></AppLayout>} />
      <Route path="/veiculos/:placa" element={<AppLayout><VeiculoDetalhes /></AppLayout>} />
      <Route path="/servicos" element={<AppLayout><Servicos /></AppLayout>} />
      <Route path="/despesas" element={<AppLayout><Despesas /></AppLayout>} />
      <Route path="/motoristas" element={<AppLayout><Motoristas /></AppLayout>} />
      <Route path="/relatorios" element={<AppLayout><Relatorios /></AppLayout>} />
      <Route path="/relatorios/mensal" element={<AppLayout><RelatorioMensal /></AppLayout>} />
      <Route path="/perfil" element={<AppLayout><Perfil /></AppLayout>} /> {/* <--- ADICIONAR ROTA */}
      
      {/* Rota NotFound (deve vir por último dentro do AppLayout se quiser que tenha layout) */}
      <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
    </Routes>
  );
}

export default App