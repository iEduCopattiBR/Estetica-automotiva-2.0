export type StatusAgendamento = 'em_andamento' | 'agendado' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteVeiculo?: string;
  servicoTipo: string;
  horario: string; // ISO string e.g. "2026-10-29T09:00:00"
  status: StatusAgendamento;
  preco: number;
  observacoes?: string;
  isSynced: boolean;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
  servicosRealizados: number;
  totalGasto: number;
  dataCadastro: string;
}

export interface GoogleAuthUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  accessToken: string;
  idToken?: string;
  expiresAt: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  tipo: 'upload' | 'download' | 'error' | 'auth';
  detalhes: string;
  sucesso: boolean;
}

export type UnidadeMedida = 'ml' | 'g' | 'unidade';

export interface Produto {
  id: string;
  nome: string;
  unidade: UnidadeMedida;
  precoPago: number;
  quantidadeEmbalagem: number;
  custoUnitario: number; // precoPago / quantidadeEmbalagem
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComboProdutoItem {
  produtoId: string;
  quantidadeUtilizada: number; // quantidade em ml, g ou unidade
}

export interface TipoServico {
  id: string;
  nome: string;
  descricao?: string;
  precoPadrao: number;
  duracaoMinutos?: number;
  produtos: ComboProdutoItem[];
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

