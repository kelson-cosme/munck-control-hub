import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Pencil } from "lucide-react"; // Importar ícones
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  ano: number;
  status: string;
}

const statusOptions = ['Ativo', 'Inativo', 'Manutenção'];

const Veiculos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o formulário (novo ou em edição)
  const [formData, setFormData] = useState<Partial<Veiculo>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('placa', { ascending: true });

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      setError('Não foi possível carregar os veículos.');
    } else {
      setVeiculos(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };
  
  const openDialogForNew = () => {
    setFormData({ ano: new Date().getFullYear(), status: 'Ativo' });
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (veiculo: Veiculo) => {
    setFormData(veiculo);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.placa || !formData.status) {
        alert("Placa e Status são campos obrigatórios.");
        return;
    }

    const vehicleData = {
        placa: formData.placa.toUpperCase(), 
        modelo: formData.modelo,
        ano: Number(formData.ano),
        status: formData.status
    };

    let error;
    
    if (formData.id) { // Se tem ID, é uma atualização
        const { error: updateError } = await supabase
            .from('veiculos')
            .update(vehicleData)
            .eq('id', formData.id);
        error = updateError;
    } else { // Senão, é uma inserção
        const { error: insertError } = await supabase
            .from('veiculos')
            .insert([vehicleData]);
        error = insertError;
    }
    
    if (error) {
        console.error('Erro ao salvar veículo:', error);
        setError('Falha ao salvar o veículo. A placa pode já existir.');
    } else {
        setIsDialogOpen(false); 
        fetchVeiculos(); // Recarrega os dados da tabela
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    const { error } = await supabase.from('veiculos').delete().eq('id', id);

    if (error) {
        console.error('Erro ao excluir veículo:', error);
        setError('Falha ao excluir o veículo.');
    } else {
        setVeiculos(prev => prev.filter(v => v.id !== id));
    }
  };


  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veiculo.modelo && veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro de Veículos</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialogForNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{formData.id ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</DialogTitle>
              <DialogDescription>
                {formData.id ? 'Altere as informações do veículo abaixo.' : 'Preencha as informações para adicionar um novo veículo.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="placa" className="text-right">Placa</Label>
                <Input id="placa" value={formData.placa || ''} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modelo" className="text-right">Modelo</Label>
                <Input id="modelo" value={formData.modelo || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ano" className="text-right">Ano</Label>
                <Input id="ano" type="number" value={formData.ano || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={formData.status || ''} onValueChange={handleStatusChange}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
              <Button onClick={handleFormSubmit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por placa ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? ( <p>A carregar veículos...</p> ) : 
           error ? ( <p className="text-destructive">{error}</p> ) : 
           (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVeiculos.map((veiculo) => (
                  <TableRow key={veiculo.id}>
                    <TableCell className="font-medium">
                      <NavLink to={`/veiculos/${veiculo.placa}`} className="text-primary hover:underline">
                        {veiculo.placa}
                      </NavLink>
                    </TableCell>
                    <TableCell>{veiculo.modelo}</TableCell>
                    <TableCell>{veiculo.ano}</TableCell>
                    <TableCell>{veiculo.status}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(veiculo)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isto irá excluir permanentemente o veículo e todos os seus serviços e despesas associados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteVehicle(veiculo.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Veiculos;