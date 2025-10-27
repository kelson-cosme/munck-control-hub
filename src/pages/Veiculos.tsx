import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Pencil, FileSearch } from "lucide-react";
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
  
  // --- Estados Separados para Busca OS e NF ---
  const [osSearchTerm, setOsSearchTerm] = useState("");
  const [osSearchResult, setOsSearchResult] = useState<string | null>(null);
  const [isOsSearching, setIsOsSearching] = useState(false);

  const [nfSearchTerm, setNfSearchTerm] = useState("");
  const [nfSearchResult, setNfSearchResult] = useState<string | null>(null);
  const [isNfSearching, setIsNfSearching] = useState(false);
  // --- Fim dos Estados Separados ---

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ... (handleInputChange, handleStatusChange, openDialogForNew, openDialogForEdit, handleFormSubmit, handleDeleteVehicle - permanecem iguais) ...
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
    const vehicleData = { /* ... */ }; // Como antes
    // ... Lógica de insert/update como antes ...
     const { error } = formData.id
      ? await supabase.from('veiculos').update(vehicleData).eq('id', formData.id)
      : await supabase.from('veiculos').insert([vehicleData]);

    if (error) { /* ... */ } else { setIsDialogOpen(false); fetchVeiculos(); }
  };

  const handleDeleteVehicle = async (id: number) => {
     const { error } = await supabase.from('veiculos').delete().eq('id', id);
     if (error) { /* ... */ } else { setVeiculos(prev => prev.filter(v => v.id !== id)); }
  };


  // --- LÓGICA DE BUSCA DA OS ---
  const handleOsSearch = async () => {
    const searchTermTrimmed = osSearchTerm.trim();
    if (!searchTermTrimmed) {
        setOsSearchResult(null);
        return;
    }
    setIsOsSearching(true);
    setOsSearchResult("A procurar OS...");

    const { data, error } = await supabase
        .from('servicos')
        .select('placa_veiculo')
        .eq('os', searchTermTrimmed) // Busca apenas na coluna 'os'
        .limit(1);

    if (error) {
        console.error('Erro ao buscar OS:', error);
        setOsSearchResult('Erro na busca.');
    } else if (data && data.length > 0) {
        setOsSearchResult(data[0].placa_veiculo);
    } else {
        setOsSearchResult('OS não encontrada.');
    }
    setIsOsSearching(false);
  };

  const handleOsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleOsSearch();
    }
  };
  // --- FIM DA LÓGICA DE BUSCA OS ---

  // --- LÓGICA DE BUSCA DA NF ---
  const handleNfSearch = async () => {
    const searchTermTrimmed = nfSearchTerm.trim();
    if (!searchTermTrimmed) {
        setNfSearchResult(null);
        return;
    }
    setIsNfSearching(true);
    setNfSearchResult("A procurar NF...");

    const { data, error } = await supabase
        .from('servicos')
        .select('placa_veiculo')
        .eq('n_fiscal', searchTermTrimmed) // Busca apenas na coluna 'n_fiscal'
        .limit(1);

    if (error) {
        console.error('Erro ao buscar NF:', error);
        setNfSearchResult('Erro na busca.');
    } else if (data && data.length > 0) {
        setNfSearchResult(data[0].placa_veiculo);
    } else {
        setNfSearchResult('NF não encontrada.');
    }
    setIsNfSearching(false);
  };

  const handleNfKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleNfSearch();
    }
  };
  // --- FIM DA LÓGICA DE BUSCA NF ---


  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veiculo.modelo && veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro de Veículos</h1>
        {/* ... (Dialog Novo/Editar Veículo) ... */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {/* ... Conteúdo do Dialog ... */}
            <DialogTrigger asChild><Button onClick={openDialogForNew}><Plus className="h-4 w-4 mr-2" />Novo Veículo</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {/* ... Header, Description, Form Fields ... */}
                 <DialogHeader><DialogTitle>{formData.id ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</DialogTitle><DialogDescription>{formData.id ? 'Altere as informações.' : 'Preencha as informações.'}</DialogDescription></DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="placa" className="text-right">Placa</Label><Input id="placa" value={formData.placa || ''} onChange={handleInputChange} className="col-span-3" required /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="modelo" className="text-right">Modelo</Label><Input id="modelo" value={formData.modelo || ''} onChange={handleInputChange} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="ano" className="text-right">Ano</Label><Input id="ano" type="number" value={formData.ano || ''} onChange={handleInputChange} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label><Select value={formData.status || ''} onValueChange={handleStatusChange}><SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{statusOptions.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent></Select></div>
                 </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleFormSubmit}>Salvar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          {/* Container Principal dos Filtros */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 mt-4"> {/* flex-wrap adicionado */}

            {/* Busca de Veículos */}
            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 mt-1.5" /> {/* Ajuste visual opcional */}
                <div>
                     <Label htmlFor="search-vehicle" className="text-xs">Buscar Veículo</Label>
                    <Input
                        id="search-vehicle"
                        placeholder="Placa ou modelo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm h-9"
                    />
                </div>
            </div>

            {/* --- Bloco de Busca por OS --- */}
            <div className="flex items-end space-x-2">
              <div>
                 <Label htmlFor="os-search" className="text-xs">Buscar Ordem Serviço</Label>
                 <div className="flex items-center">
                    <FileSearch className="h-4 w-4 mr-1 text-muted-foreground"/>
                    <Input
                        id="os-search"
                        placeholder="Número da OS..."
                        value={osSearchTerm}
                        onChange={(e) => setOsSearchTerm(e.target.value)}
                        onKeyDown={handleOsKeyDown}
                        className="max-w-[150px] h-9"
                        disabled={isOsSearching}
                    />
                 </div>
              </div>
              <Button onClick={handleOsSearch} size="sm" disabled={isOsSearching} className="h-9">
                {isOsSearching ? '...' : <Search className="h-4 w-4" />}
              </Button>
            </div>
             {/* --- Fim do Bloco de Busca por OS --- */}

             {/* --- Bloco de Busca por NF --- */}
            <div className="flex items-end space-x-2">
              <div>
                 <Label htmlFor="nf-search" className="text-xs">Buscar Nota Fiscal</Label>
                 <div className="flex items-center">
                    <FileSearch className="h-4 w-4 mr-1 text-muted-foreground"/>
                    <Input
                        id="nf-search"
                        placeholder="Número da NF..."
                        value={nfSearchTerm}
                        onChange={(e) => setNfSearchTerm(e.target.value)}
                        onKeyDown={handleNfKeyDown}
                        className="max-w-[150px] h-9"
                        disabled={isNfSearching}
                    />
                 </div>
              </div>
              <Button onClick={handleNfSearch} size="sm" disabled={isNfSearching} className="h-9">
                {isNfSearching ? '...' : <Search className="h-4 w-4" />}
              </Button>
            </div>
             {/* --- Fim do Bloco de Busca por NF --- */}

          </div>

          {/* --- Exibição Separada dos Resultados --- */}
          {(osSearchResult || nfSearchResult) && (
            <div className="mt-2 text-sm space-y-1"> {/* Adicionado space-y-1 */}
                {/* Resultado OS */}
                {osSearchResult && (
                    <div>
                        {osSearchResult.startsWith('Erro') || osSearchResult.startsWith('OS') || osSearchResult.startsWith('A procurar') ? (
                            <span className={osSearchResult.startsWith('Erro') ? 'text-destructive' : 'text-muted-foreground'}>{osSearchResult}</span>
                        ) : (
                            <span>
                                OS encontrada no veículo: {' '}
                                <NavLink to={`/veiculos/${osSearchResult}`} className="text-primary hover:underline font-medium">
                                    {osSearchResult}
                                </NavLink>
                            </span>
                        )}
                    </div>
                )}
                {/* Resultado NF */}
                 {nfSearchResult && (
                    <div>
                        {nfSearchResult.startsWith('Erro') || nfSearchResult.startsWith('NF') || nfSearchResult.startsWith('A procurar') ? (
                            <span className={nfSearchResult.startsWith('Erro') ? 'text-destructive' : 'text-muted-foreground'}>{nfSearchResult}</span>
                        ) : (
                            <span>
                                NF encontrada no veículo: {' '}
                                <NavLink to={`/veiculos/${nfSearchResult}`} className="text-primary hover:underline font-medium">
                                    {nfSearchResult}
                                </NavLink>
                            </span>
                        )}
                    </div>
                )}
            </div>
          )}
          {/* --- Fim da Exibição dos Resultados --- */}
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