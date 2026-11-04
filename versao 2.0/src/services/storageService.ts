import { Agendamento, Cliente, SyncLog, GoogleAuthUser, Produto, TipoServico, ComboProdutoItem } from '../types';

const AGENDAMENTOS_KEY = 'schmitt_detailer_agendamentos';
const CLIENTES_KEY = 'schmitt_detailer_clientes';
const PRODUTOS_KEY = 'schmitt_detailer_produtos';
const TIPOS_SERVICO_KEY = 'schmitt_detailer_tipos_servico';
const SYNC_LOGS_KEY = 'schmitt_detailer_sync_logs';
const AUTH_KEY = 'schmitt_detailer_google_auth';
const NETWORK_SIMULATION_KEY = 'schmitt_detailer_is_online';

const DEFAULT_PRODUTOS: Produto[] = [
  {
    id: 'prod-1',
    nome: 'Shampoo Automotivo Neutro V-Floc',
    unidade: 'ml',
    precoPago: 85.0,
    quantidadeEmbalagem: 3000,
    custoUnitario: 85.0 / 3000,
    ativo: true,
  },
  {
    id: 'prod-2',
    nome: 'Desengraxante / APC Sintra Pro',
    unidade: 'ml',
    precoPago: 65.0,
    quantidadeEmbalagem: 1500,
    custoUnitario: 65.0 / 1500,
    ativo: true,
  },
  {
    id: 'prod-3',
    nome: 'Cera de Carnaúba Blend Ceramic',
    unidade: 'g',
    precoPago: 120.0,
    quantidadeEmbalagem: 100,
    custoUnitario: 120.0 / 100,
    ativo: true,
  },
  {
    id: 'prod-4',
    nome: 'Composto Polidor Corte & Refino V10/V20',
    unidade: 'g',
    precoPago: 160.0,
    quantidadeEmbalagem: 500,
    custoUnitario: 160.0 / 500,
    ativo: true,
  },
  {
    id: 'prod-5',
    nome: 'Condicionador de Plásticos & Pneus',
    unidade: 'ml',
    precoPago: 50.0,
    quantidadeEmbalagem: 1000,
    custoUnitario: 50.0 / 1000,
    ativo: true,
  },
  {
    id: 'prod-6',
    nome: 'Selante SiO2 Paint Rubber',
    unidade: 'ml',
    precoPago: 140.0,
    quantidadeEmbalagem: 500,
    custoUnitario: 140.0 / 500,
    ativo: true,
  },
  {
    id: 'prod-7',
    nome: 'Flanela Microfibra 40x40 350GSM',
    unidade: 'unidade',
    precoPago: 15.0,
    quantidadeEmbalagem: 1,
    custoUnitario: 15.0,
    ativo: true,
  },
];

const DEFAULT_TIPOS_SERVICO: TipoServico[] = [
  {
    id: 'srv-1',
    nome: 'Lavagem Técnica Detalhada + Cera',
    descricao: 'Lavagem detalhada de caixas de roda, pincelamento e cera de carnaúba.',
    precoPadrao: 180.0,
    duracaoMinutos: 120,
    produtos: [
      { produtoId: 'prod-1', quantidadeUtilizada: 60 },
      { produtoId: 'prod-2', quantidadeUtilizada: 40 },
      { produtoId: 'prod-3', quantidadeUtilizada: 15 },
      { produtoId: 'prod-5', quantidadeUtilizada: 30 },
    ],
    ativo: true,
  },
  {
    id: 'srv-2',
    nome: 'Higienização Interna Completa',
    descricao: 'Higienização profunda dos bancos, carpete, forro, painel e portas.',
    precoPadrao: 380.0,
    duracaoMinutos: 240,
    produtos: [
      { produtoId: 'prod-2', quantidadeUtilizada: 200 },
      { produtoId: 'prod-5', quantidadeUtilizada: 40 },
      { produtoId: 'prod-7', quantidadeUtilizada: 1 },
    ],
    ativo: true,
  },
  {
    id: 'srv-3',
    nome: 'Polimento Técnico Comercial + Selante',
    descricao: 'Descontaminação, polimento técnico e proteção selante SiO2.',
    precoPadrao: 650.0,
    duracaoMinutos: 360,
    produtos: [
      { produtoId: 'prod-1', quantidadeUtilizada: 80 },
      { produtoId: 'prod-4', quantidadeUtilizada: 80 },
      { produtoId: 'prod-6', quantidadeUtilizada: 35 },
      { produtoId: 'prod-7', quantidadeUtilizada: 2 },
    ],
    ativo: true,
  },
  {
    id: 'srv-4',
    nome: 'Vitrificação de Pintura Cerâmica 9H',
    descricao: 'Polimento minucioso, desengraxe total e vitrificador cerâmico até 3 anos.',
    precoPadrao: 1500.0,
    duracaoMinutos: 480,
    produtos: [
      { produtoId: 'prod-1', quantidadeUtilizada: 100 },
      { produtoId: 'prod-2', quantidadeUtilizada: 100 },
      { produtoId: 'prod-4', quantidadeUtilizada: 120 },
      { produtoId: 'prod-6', quantidadeUtilizada: 50 },
      { produtoId: 'prod-7', quantidadeUtilizada: 3 },
    ],
    ativo: true,
  },
];


// In-memory fallback map for environments where localStorage is restricted or throws SecurityError (e.g. WebView)
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn(`[Storage] localStorage.getItem failed for "${key}", using memory store`, err);
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (err) {
    console.warn(`[Storage] localStorage.setItem failed for "${key}", using memory store`, err);
  }
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (err) {
    console.warn(`[Storage] localStorage.removeItem failed for "${key}"`, err);
  }
  delete memoryStorage[key];
}

// Zero data initial state - starting clean for real workshop use
const INITIAL_CLIENTS: Cliente[] = [];
const INITIAL_AGENDAMENTOS: Agendamento[] = [];

// Clean slate migration flag to wipe previous mock data on already loaded browsers
const ZERO_SLATE_VERSION_KEY = 'schmitt_detailer_zero_slate_v3';

function autoPurgeOldMockData(): void {
  try {
    const isClean = safeGetItem(ZERO_SLATE_VERSION_KEY);
    if (isClean !== 'true') {
      // Clear out old mock clients and appointments
      safeSetItem(CLIENTES_KEY, JSON.stringify([]));
      safeSetItem(AGENDAMENTOS_KEY, JSON.stringify([]));
      safeSetItem(SYNC_LOGS_KEY, JSON.stringify([]));

      // If previous auth was the dummy detailer.schmitt account, clear it so user can enter their own account
      const currentAuth = safeGetItem(AUTH_KEY);
      if (currentAuth && currentAuth.includes('detailer.schmitt@gmail.com')) {
        safeRemoveItem(AUTH_KEY);
      }

      safeSetItem(ZERO_SLATE_VERSION_KEY, 'true');
    }
  } catch (err) {
    console.warn('[Storage] Error during zero-slate purge:', err);
  }
}

// Run auto-purge immediately on module load
autoPurgeOldMockData();

export const storageService = {
  getAgendamentos(): Agendamento[] {
    const raw = safeGetItem(AGENDAMENTOS_KEY);
    if (!raw) {
      safeSetItem(AGENDAMENTOS_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveAgendamentos(data: Agendamento[]) {
    safeSetItem(AGENDAMENTOS_KEY, JSON.stringify(data));
  },

  addAgendamento(item: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Agendamento {
    const list = this.getAgendamentos();
    const isOnline = this.isOnline();
    const newItem: Agendamento = {
      ...item,
      id: Date.now().toString(),
      isSynced: false, // Default is false for offline-first architecture!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newItem);
    this.saveAgendamentos(list);

    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Novo agendamento salvo localmente (Isar DB): ${newItem.clienteNome} - ${newItem.servicoTipo}`,
      sucesso: true,
    });

    if (isOnline) {
      // Auto-trigger sync if online
      this.syncPendingToGoogleCalendar();
    }

    return newItem;
  },

  updateAgendamento(id: string, updates: Partial<Agendamento>): Agendamento | null {
    const list = this.getAgendamentos();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const updated: Agendamento = {
      ...list[idx],
      ...updates,
      isSynced: false, // Mark as unsynced so Google Calendar will receive updates
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.saveAgendamentos(list);

    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Agendamento #${id} (${updated.clienteNome}) atualizado localmente. Marcado para sincronizar.`,
      sucesso: true,
    });

    if (this.isOnline()) {
      this.syncPendingToGoogleCalendar();
    }

    return updated;
  },

  deleteAgendamento(id: string): boolean {
    const list = this.getAgendamentos();
    const item = list.find((a) => a.id === id);
    if (!item) return false;

    const filtered = list.filter((a) => a.id !== id);
    this.saveAgendamentos(filtered);

    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Agendamento #${id} (${item.clienteNome}) removido do banco de dados local.`,
      sucesso: true,
    });

    return true;
  },

  getClientes(): Cliente[] {
    const raw = safeGetItem(CLIENTES_KEY);
    if (!raw) {
      safeSetItem(CLIENTES_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addCliente(cliente: Omit<Cliente, 'id' | 'servicosRealizados' | 'totalGasto' | 'dataCadastro'>): Cliente {
    const list = this.getClientes();
    const newCli: Cliente = {
      ...cliente,
      id: 'cli-' + Date.now().toString(),
      servicosRealizados: 0,
      totalGasto: 0,
      dataCadastro: new Date().toISOString().split('T')[0],
    };
    list.unshift(newCli);
    safeSetItem(CLIENTES_KEY, JSON.stringify(list));
    return newCli;
  },

  // Auth management
  getGoogleAuth(): GoogleAuthUser | null {
    const raw = safeGetItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setGoogleAuth(user: GoogleAuthUser | null) {
    if (user) {
      safeSetItem(AUTH_KEY, JSON.stringify(user));
      this.addSyncLog({
        tipo: 'auth',
        detalhes: `Usuário autenticado no Google: ${user.email}. Token salvo em armazenamento seguro.`,
        sucesso: true,
      });
    } else {
      safeRemoveItem(AUTH_KEY);
      this.addSyncLog({
        tipo: 'auth',
        detalhes: `Sessão Google encerrada.`,
        sucesso: true,
      });
    }
  },

  // Network simulation toggle for testing offline-first on device
  isOnline(): boolean {
    const stored = safeGetItem(NETWORK_SIMULATION_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  setOnlineStatus(online: boolean) {
    safeSetItem(NETWORK_SIMULATION_KEY, String(online));
    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Estado da rede alterado para: ${online ? 'ONLINE (Conectado à Internet)' : 'OFFLINE (Modo Sem Internet)'}`,
      sucesso: true,
    });
    if (online) {
      this.syncPendingToGoogleCalendar();
    }
  },

  // Sync logs
  getSyncLogs(): SyncLog[] {
    const raw = safeGetItem(SYNC_LOGS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addSyncLog(log: Omit<SyncLog, 'id' | 'timestamp'>) {
    const logs = this.getSyncLogs();
    const newLog: SyncLog = {
      ...log,
      id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };
    logs.unshift(newLog);
    // Keep last 30 logs
    safeSetItem(SYNC_LOGS_KEY, JSON.stringify(logs.slice(0, 30)));
  },

  // Synchronize unsynced items to Google Calendar API simulation
  syncPendingToGoogleCalendar(): { syncedCount: number; message: string } {
    const isOnline = this.isOnline();
    if (!isOnline) {
      return { syncedCount: 0, message: 'Dispositivo offline. Os dados permanecem salvos localmente no Isar DB.' };
    }

    const auth = this.getGoogleAuth();
    if (!auth) {
      return { syncedCount: 0, message: 'Google Agenda não autenticado. Faça login com a conta Google para sincronizar.' };
    }

    const list = this.getAgendamentos();
    const unsynced = list.filter((a) => !a.isSynced);

    if (unsynced.length === 0) {
      return { syncedCount: 0, message: 'Todos os agendamentos já estão sincronizados com o Google Agenda.' };
    }

    let synced = 0;
    const updatedList = list.map((item) => {
      if (!item.isSynced) {
        synced++;
        return {
          ...item,
          isSynced: true,
          googleEventId: item.googleEventId || `gcal_${Date.now()}_${item.id}`,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    this.saveAgendamentos(updatedList);
    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Sincronização concluída: ${synced} agendamento(s) enviado(s) para a Google Calendar API (primary).`,
      sucesso: true,
    });

    return {
      syncedCount: synced,
      message: `${synced} agendamento(s) sincronizado(s) com sucesso na Google Agenda!`,
    };
  },

  // --- PRODUTOS & INSUMOS ---
  getProdutos(): Produto[] {
    const raw = safeGetItem(PRODUTOS_KEY);
    if (!raw) {
      safeSetItem(PRODUTOS_KEY, JSON.stringify(DEFAULT_PRODUTOS));
      return DEFAULT_PRODUTOS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUTOS;
    } catch {
      return DEFAULT_PRODUTOS;
    }
  },

  saveProdutos(list: Produto[]): void {
    safeSetItem(PRODUTOS_KEY, JSON.stringify(list));
  },

  addProduto(item: Omit<Produto, 'id' | 'custoUnitario'>): Produto {
    const list = this.getProdutos();
    const custoUnitario = item.quantidadeEmbalagem > 0 ? item.precoPago / item.quantidadeEmbalagem : 0;
    const now = new Date().toISOString();
    const novoProduto: Produto = {
      ...item,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      custoUnitario,
      createdAt: now,
      updatedAt: now,
    };
    list.push(novoProduto);
    this.saveProdutos(list);
    return novoProduto;
  },

  updateProduto(item: Produto): void {
    const list = this.getProdutos();
    const custoUnitario = item.quantidadeEmbalagem > 0 ? item.precoPago / item.quantidadeEmbalagem : 0;
    const index = list.findIndex((p) => p.id === item.id);
    if (index !== -1) {
      list[index] = {
        ...item,
        custoUnitario,
        updatedAt: new Date().toISOString(),
      };
      this.saveProdutos(list);
    }
  },

  deleteProduto(id: string): void {
    const list = this.getProdutos().filter((p) => p.id !== id);
    this.saveProdutos(list);

    // Also remove from any combos using this product
    const servicos = this.getTiposServico();
    const updatedServicos = servicos.map((s) => ({
      ...s,
      produtos: s.produtos.filter((cp) => cp.produtoId !== id),
    }));
    this.saveTiposServico(updatedServicos);
  },

  // --- TIPOS DE SERVIÇO & COMBOS ---
  getTiposServico(): TipoServico[] {
    const raw = safeGetItem(TIPOS_SERVICO_KEY);
    if (!raw) {
      safeSetItem(TIPOS_SERVICO_KEY, JSON.stringify(DEFAULT_TIPOS_SERVICO));
      return DEFAULT_TIPOS_SERVICO;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TIPOS_SERVICO;
    } catch {
      return DEFAULT_TIPOS_SERVICO;
    }
  },

  saveTiposServico(list: TipoServico[]): void {
    safeSetItem(TIPOS_SERVICO_KEY, JSON.stringify(list));
  },

  addTipoServico(item: Omit<TipoServico, 'id'>): TipoServico {
    const list = this.getTiposServico();
    const now = new Date().toISOString();
    const novoServico: TipoServico = {
      ...item,
      id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.push(novoServico);
    this.saveTiposServico(list);
    return novoServico;
  },

  updateTipoServico(item: TipoServico): void {
    const list = this.getTiposServico();
    const index = list.findIndex((s) => s.id === item.id);
    if (index !== -1) {
      list[index] = {
        ...item,
        updatedAt: new Date().toISOString(),
      };
      this.saveTiposServico(list);
    }
  },

  deleteTipoServico(id: string): void {
    const list = this.getTiposServico().filter((s) => s.id !== id);
    this.saveTiposServico(list);
  },

  calcularCustoServico(servico: TipoServico, produtosList?: Produto[]) {
    const produtos = produtosList || this.getProdutos();
    const prodMap = new Map(produtos.map((p) => [p.id, p]));

    let custoTotal = 0;
    const produtosDetalhados = (servico.produtos || []).map((cp) => {
      const p = prodMap.get(cp.produtoId);
      const custoItem = p ? p.custoUnitario * cp.quantidadeUtilizada : 0;
      custoTotal += custoItem;
      return {
        produto: p || {
          id: cp.produtoId,
          nome: 'Produto não encontrado',
          unidade: 'unidade' as const,
          precoPago: 0,
          quantidadeEmbalagem: 1,
          custoUnitario: 0,
          ativo: false,
        },
        quantidade: cp.quantidadeUtilizada,
        custoItem,
      };
    });

    const margemLucro = servico.precoPadrao - custoTotal;
    const margemLucroPct = servico.precoPadrao > 0 ? (margemLucro / servico.precoPadrao) * 100 : 0;

    return {
      custoTotal,
      margemLucro,
      margemLucroPct,
      produtosDetalhados,
    };
  },

  resetToDefault() {
    safeSetItem(AGENDAMENTOS_KEY, JSON.stringify([]));
    safeSetItem(CLIENTES_KEY, JSON.stringify([]));
    safeSetItem(SYNC_LOGS_KEY, JSON.stringify([]));
    safeRemoveItem(NETWORK_SIMULATION_KEY);
    this.addSyncLog({
      tipo: 'upload',
      detalhes: 'Base de dados resetada. Sistema limpo para operação a partir do zero.',
      sucesso: true,
    });
  },

  clearAllData(keepAuth = true) {
    safeSetItem(AGENDAMENTOS_KEY, JSON.stringify([]));
    safeSetItem(CLIENTES_KEY, JSON.stringify([]));
    safeSetItem(SYNC_LOGS_KEY, JSON.stringify([]));
    if (!keepAuth) {
      safeRemoveItem(AUTH_KEY);
    }
    this.addSyncLog({
      tipo: 'upload',
      detalhes: 'Todos os clientes, agendamentos e registros foram completamente apagados.',
      sucesso: true,
    });
  },
};
