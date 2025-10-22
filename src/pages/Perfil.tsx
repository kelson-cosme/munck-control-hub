// src/pages/Perfil.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast'; // Para feedback visual

const Perfil = () => {
  const { user } = useAuth(); // Obtém o utilizador atual do contexto
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o campo nome com o valor atual ao carregar
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    } else if (user?.user_metadata?.full_name) { // Fallback para full_name
      setDisplayName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName // Atualiza o user_metadata
      }
    });

    setLoading(false);

    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      setError("Não foi possível atualizar o nome. Tente novamente.");
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome. Tente novamente.",
        variant: "destructive",
      });
    } else {
      console.log("Perfil atualizado:", data.user?.user_metadata);
      setError(null);
      toast({
        title: "Sucesso!",
        description: "O seu nome de exibição foi atualizado.",
      });
      // O listener no AuthContext deve eventualmente atualizar o 'user',
      // mas para feedback imediato, poderíamos forçar um refresh ou atualizar o estado local do AuthContext.
      // Por agora, vamos confiar no listener.
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <Card className="w-full max-w-lg">
        <form onSubmit={handleUpdateProfile}>
          <CardHeader>
            <CardTitle>Detalhes do Utilizador</CardTitle>
            <CardDescription>Atualize o seu nome de exibição.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {/* Mostra o email (não editável) */}
              <Input id="email" type="email" value={user?.email || ''} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Como quer ser chamado?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Perfil;