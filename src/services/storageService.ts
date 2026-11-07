import { Agendamento, Cliente, SyncLog, GoogleAuthUser, Produto, TipoServico, ComboProdutoItem } from '../types';

const AGENDAMENTOS_KEY = 'schmitt_detailer_agendamentos';
const CLIENTES_KEY = 'schmitt_detailer_clientes';
const PRODUTOS_KEY = 'schmitt_detailer_produtos';
const TIPOS_SERVICO_KEY = 'schmitt_detailer_tipos_servico';
const SYNC_LOGS_KEY = 'schmitt_detailer_sync_logs';
const AUTH_KEY = 'schmitt_detailer_google_auth';
const PENDING_DELETES_KEY = 'schmitt_detailer_pending_deletes';
const NETWORK_SIMULATION_KEY = 'schmitt_detailer_is_online';

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

    if (item.googleEventId) {
      this.savePendingDeletes([...this.getPendingDeletes(), item.googleEventId]);
      if (this.isOnline()) {
        this.syncPendingToGoogleCalendar();
      }
    }

    this.addSyncLog({
      tipo: 'upload',
      detalhes: `Agendamento #${id} (${item.clienteNome}) removido do banco de dados local.`,
      sucesso: true,
    });

    return true;
  },

  _syncTimer: undefined as ReturnType<typeof setTimeout> | undefined,

  // Agenda uma sincronização logo depois de alterar clientes, serviços ou insumos
  scheduleSync() {
    if (!this.getGoogleAuth() || !this.isOnline()) return;
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncTimer = undefined;
      this.syncPendingToGoogleCalendar();
    }, 2500);
  },

  // Lista de clientes com as estatísticas calculadas a partir dos agendamentos concluídos
  getClientes(): Cliente[] {
    const list = this.getClientesRaw();
    if (list.length === 0) return list;
    const norm = (t: string) => (t || '').trim().toLowerCase();
    const concluidos = this.getAgendamentos().filter((a) => a.status === 'concluido');
    return list.map((c) => {
      const doCliente = concluidos.filter((a) => norm(a.clienteNome) === norm(c.nome));
      return {
        ...c,
        servicosRealizados: doCliente.length,
        totalGasto: doCliente.reduce((total, a) => total + (a.preco || 0), 0),
      };
    });
  },

  // Cadastro como está guardado (sem estatísticas calculadas)
  getClientesRaw(): Cliente[] {
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
    const list = this.getClientesRaw();
    const newCli: Cliente = {
      ...cliente,
      id: 'cli-' + Date.now().toString(),
      servicosRealizados: 0,
      totalGasto: 0,
      dataCadastro: new Date().toISOString().split('T')[0],
    };
    list.unshift(newCli);
    safeSetItem(CLIENTES_KEY, JSON.stringify(list));
    this.scheduleSync();
    return newCli;
  },

  updateCliente(id: string, updates: Partial<Omit<Cliente, 'id'>>): Cliente | null {
    const list = this.getClientesRaw();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: Cliente = { ...list[idx], ...updates, id: list[idx].id };
    list[idx] = updated;
    safeSetItem(CLIENTES_KEY, JSON.stringify(list));
    this.scheduleSync();
    return updated;
  },

  deleteCliente(id: string): boolean {
    const list = this.getClientesRaw();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;
    safeSetItem(CLIENTES_KEY, JSON.stringify(filtered));
    this.scheduleSync();
    return true;
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

  // Exclusões feitas offline que ainda precisam ser enviadas ao Google Agenda
  getPendingDeletes(): string[] {
    const raw = safeGetItem(PENDING_DELETES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  savePendingDeletes(ids: string[]) {
    safeSetItem(PENDING_DELETES_KEY, JSON.stringify(Array.from(new Set(ids))));
  },

  // Sincronização REAL com o Google Agenda (envia pendentes e puxa novidades)
  async syncPendingToGoogleCalendar(): Promise<{ syncedCount: number; message: string }> {
    const mod = await import('./googleCalendar');
    return mod.syncAll();
  },

  // --- PRODUTOS & INSUMOS ---
  getProdutos(): Produto[] {
    const raw = safeGetItem(PRODUTOS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveProdutos(list: Produto[]): void {
    safeSetItem(PRODUTOS_KEY, JSON.stringify(list));
    this.scheduleSync();
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
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveTiposServico(list: TipoServico[]): void {
    safeSetItem(TIPOS_SERVICO_KEY, JSON.stringify(list));
    this.scheduleSync();
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
