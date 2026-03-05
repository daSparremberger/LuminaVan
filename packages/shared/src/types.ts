export type Turno = 'manha' | 'tarde' | 'noite';
export type UserRole = 'gestor' | 'motorista';

export interface Tenant {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  criado_em: string;
}

export interface Gestor {
  id: number;
  tenant_id: number;
  firebase_uid: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
}

export interface Escola {
  id: number;
  tenant_id: number;
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  turno_manha: boolean;
  turno_tarde: boolean;
  turno_noite: boolean;
  horario_entrada_manha?: string;
  horario_saida_manha?: string;
  horario_entrada_tarde?: string;
  horario_saida_tarde?: string;
  horario_entrada_noite?: string;
  horario_saida_noite?: string;
  criado_em: string;
  // Computed
  contatos?: EscolaContato[];
}

export interface Motorista {
  id: number;
  tenant_id: number;
  firebase_uid?: string;
  nome: string;
  telefone?: string;
  foto_url?: string;
  documento_url?: string;
  pin_hash?: string;
  ativo: boolean;
  convite_token?: string;
  convite_expira_em?: string;
  cadastro_completo: boolean;
  permissoes?: Record<string, boolean>;
  criado_em: string;
}

export interface Aluno {
  id: number;
  tenant_id: number;
  nome: string;
  nascimento?: string;
  telefone?: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  escola_id: number;
  escola_nome?: string;
  turno: Turno;
  turma?: string;
  ano?: string;
  // Responsavel
  nome_responsavel?: string;
  cpf_responsavel?: string;
  nascimento_responsavel?: string;
  telefone_responsavel?: string;
  // Contrato
  valor_mensalidade?: number;
  meses_contrato?: number;
  inicio_contrato?: string;
  // Saude
  restricoes?: string;
  observacoes?: string;
  ativo: boolean;
  criado_em: string;
  // Biometria facial
  face_embeddings?: number[][];  // Array of 128-d vectors
}

export interface RotaParada {
  id: number;
  rota_id: number;
  aluno_id: number;
  aluno_nome?: string;
  aluno_endereco?: string;
  ordem: number;
  lat: number | null;
  lng: number | null;
}

export type RotaStatus = 'planejada' | 'em_andamento' | 'finalizada';

export interface Rota {
  id: number;
  tenant_id: number;
  nome: string;
  motorista_id: number;
  motorista_nome?: string;
  veiculo_id?: number;
  veiculo_placa?: string;
  turno: Turno;
  status?: RotaStatus;
  horario_inicio?: string;
  distancia_km?: number;
  tempo_minutos?: number;
  ativo: boolean;
  rota_geojson?: string;
  paradas?: RotaParada[];
  criado_em: string;
}

export interface RotaHistorico {
  id: number;
  tenant_id: number;
  rota_id: number;
  rota_nome?: string;
  motorista_id: number;
  motorista_nome?: string;
  data_inicio?: string;
  data_fim?: string;
  km_total?: number;
  alunos_embarcados: number;
  alunos_pulados: number;
  criado_em: string;
}

export interface UserProfile {
  id: number;
  tenant_id: number;
  firebase_uid: string;
  nome: string;
  email?: string;
  role: UserRole;
}

// Financeiro
export type TipoTransacao = 'receita' | 'despesa';

export interface Transacao {
  id: number;
  tenant_id: number;
  tipo: TipoTransacao;
  categoria: string;
  descricao?: string;
  valor: number;
  data: string;
  aluno_id?: number;
  aluno_nome?: string;
  pago: boolean;
  criado_em: string;
}

export interface ResumoFinanceiro {
  receitas: number;
  despesas: number;
  saldo: number;
  inadimplentes: number;
}

// Veiculos
export interface Veiculo {
  id: number;
  tenant_id: number;
  placa: string;
  modelo: string;
  fabricante: string;
  ano?: number;
  capacidade: number;
  consumo_km?: number;
  renavam?: string;
  chassi?: string;
  ativo: boolean;
  criado_em: string;
  // Computed
  motoristas_habilitados?: VeiculoMotorista[];
  rotas_vinculadas?: Rota[];
}

export interface VeiculoMotorista {
  id: number;
  veiculo_id: number;
  motorista_id: number;
  motorista_nome?: string;
  ativo: boolean;
}

// Contatos de Escola
export interface EscolaContato {
  id: number;
  escola_id: number;
  cargo: string;
  nome: string;
  telefone?: string;
}

// Mensagens
export interface Mensagem {
  id: number;
  tenant_id: number;
  remetente_id: number;
  remetente_tipo: 'gestor' | 'motorista';
  remetente_nome?: string;
  destinatario_id: number;
  destinatario_tipo: 'gestor' | 'motorista';
  destinatario_nome?: string;
  conteudo: string;
  lido: boolean;
  criado_em: string;
}

export interface Conversa {
  participante_id: number;
  participante_tipo: 'gestor' | 'motorista';
  participante_nome: string;
  ultima_mensagem?: string;
  ultima_mensagem_data?: string;
  nao_lidas: number;
  online?: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  veiculos_ativos: number;
  veiculos_total: number;
  motoristas_em_acao: number;
  rotas_hoje: number;
  alunos_total: number;
}

export interface DashboardChartData {
  rotas_por_dia: { data: string; total: number }[];
  alunos_por_escola: { escola: string; total: number }[];
  financeiro_mensal: { mes: string; receitas: number; despesas: number }[];
  atividade_por_turno: { turno: string; rotas: number }[];
}
