import { Agendamento, GoogleAuthUser, StatusAgendamento } from '../types';
import { storageService } from './storageService';

/**
 * Integração REAL com o Google Agenda.
 * - O login/token vem do app Android nativo (ponte "AndroidGoogle", ver MainActivity.java).
 * - A sincronização usa a API REST do Google Calendar com esse token.
 * - Os agendamentos ficam numa agenda própria chamada "Agenda de Clientes".
 * - Todo evento criado pelo app leva a marcação #Dsc.
 */

declare global {
  interface Window {
    AndroidGoogle?: { requestToken: (reqId: string) => void };
    __gcb?: (reqId: string, ok: boolean, payload: string) => void;
  }
}

const API = 'https://www.googleapis.com/calendar/v3';
const CAL_NAME = 'Agenda de Clientes';
const TAG = '#Dsc';
const CAL_ID_KEY = 'schmitt_detailer_calendar_id';
const LAST_PULL_KEY = 'schmitt_detailer_last_pull';

export interface SyncResult {
  syncedCount: number;
  message: string;
}

// ---------------------------------------------------------------- token nativo

const pendingTokens = new Map<string, { resolve: (t: string) => void; reject: (e: Error) => void }>();

if (typeof window !== 'undefined') {
  window.__gcb = (reqId, ok, payload) => {
    const p = pendingTokens.get(reqId);
    if (!p) return;
    pendingTokens.delete(reqId);
    if (ok) p.resolve(payload);
    else p.reject(new Error(payload || 'Falha no login Google.'));
  };
}

export function isNative(): boolean {
  return typeof window !== 'undefined' && !!window.AndroidGoogle;
}

let tokenCache: { token: string; exp: number } | null = null;

async function getToken(force = false): Promise<string> {
  if (!isNative()) {
    throw new Error('O login Google só funciona no app Android instalado (APK).');
  }
  if (!force && tokenCache && tokenCache.exp > Date.now()) return tokenCache.token;

  const reqId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const token = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingTokens.delete(reqId);
      reject(new Error('Tempo esgotado esperando o login Google.'));
    }, 180000);
    pendingTokens.set(reqId, {
      resolve: (t) => {
        clearTimeout(timer);
        resolve(t);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    window.AndroidGoogle!.requestToken(reqId);
  });
  tokenCache = { token, exp: Date.now() + 45 * 60 * 1000 };
  return token;
}

// ---------------------------------------------------------------- chamadas REST

async function api(path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  const doFetch = async (token: string) =>
    fetch(API + path, {
      method: init.method || 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res = await doFetch(await getToken());
  if (res.status === 401) {
    res = await doFetch(await getToken(true));
  }
  return res;
}

async function failIfNotOk(res: Response, what: string): Promise<void> {
  if (res.ok) return;
  let detail = '';
  try {
    const j = await res.json();
    detail = j?.error?.message || '';
  } catch {
    /* ignore */
  }
  throw new Error(`${what} (${res.status})${detail ? ': ' + detail : ''}`);
}

const timeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
};

// ---------------------------------------------------------------- login

export async function signIn(): Promise<GoogleAuthUser> {
  const token = await getToken(true);
  const res = await fetch(`${API}/calendars/primary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await failIfNotOk(res, 'Não foi possível ler a conta Google');
  const cal = await res.json();
  const email: string = String(cal.id || '').toLowerCase();
  if (!email) throw new Error('Não foi possível identificar o e-mail da conta Google.');

  // conta nova => procurar de novo a agenda "Agenda de Clientes"
  localStorage.removeItem(CAL_ID_KEY);
  localStorage.removeItem(LAST_PULL_KEY);

  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: email,
    email,
    displayName: name,
    accessToken: 'nativo',
    expiresAt: 0,
  };
}

export function signOut(): void {
  tokenCache = null;
  try {
    localStorage.removeItem(CAL_ID_KEY);
    localStorage.removeItem(LAST_PULL_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- agenda dedicada

async function ensureCalendar(): Promise<string> {
  const cached = localStorage.getItem(CAL_ID_KEY);
  if (cached) return cached;

  let pageToken = '';
  do {
    const res = await api(`/users/me/calendarList?maxResults=250${pageToken ? '&pageToken=' + pageToken : ''}`);
    await failIfNotOk(res, 'Falha ao listar agendas');
    const data = await res.json();
    const found = (data.items || []).find(
      (c: { summary?: string; summaryOverride?: string; accessRole?: string }) =>
        (c.summary === CAL_NAME || c.summaryOverride === CAL_NAME) &&
        (c.accessRole === 'owner' || c.accessRole === 'writer')
    );
    if (found) {
      localStorage.setItem(CAL_ID_KEY, found.id);
      return found.id as string;
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  const created = await api('/calendars', {
    method: 'POST',
    body: { summary: CAL_NAME, description: 'Agendamentos do Schmitt Detailer ' + TAG, timeZone: timeZone() },
  });
  await failIfNotOk(created, 'Falha ao criar a agenda "Agenda de Clientes"');
  const cal = await created.json();
  localStorage.setItem(CAL_ID_KEY, cal.id);
  return cal.id as string;
}

// ---------------------------------------------------------------- conversões

const pad = (n: number) => String(n).padStart(2, '0');

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const eventIdFor = (a: Agendamento) => `dsc${a.id}`.toLowerCase().replace(/[^a-v0-9]/g, '0');

const STATUS_PREFIX: Record<StatusAgendamento, string> = {
  agendado: '',
  em_andamento: '[EM ANDAMENTO] ',
  concluido: '[CONCLUÍDO] ',
  cancelado: '[CANCELADO] ',
};

function toEvent(a: Agendamento) {
  const start = new Date(a.horario);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const tz = timeZone();

  const lines: string[] = [];
  lines.push(`Cliente: ${a.clienteNome}`);
  lines.push(`Serviço: ${a.servicoTipo}`);
  if (a.endereco) lines.push(`Endereço: ${a.endereco}`);
  if (a.clienteVeiculo) lines.push(`Veículo: ${a.clienteVeiculo}`);
  if (a.clienteTelefone) lines.push(`Telefone: ${a.clienteTelefone}`);
  lines.push(`Valor: R$ ${(a.preco || 0).toFixed(2).replace('.', ',')}`);
  if (a.observacoes) lines.push(`Obs: ${a.observacoes}`);
  lines.push('');
  lines.push(TAG);

  const priv: Record<string, string> = {
    dscId: a.id,
    cliente: a.clienteNome,
    servico: a.servicoTipo,
    preco: String(a.preco || 0),
    status: a.status,
  };
  if (a.clienteTelefone) priv.telefone = a.clienteTelefone;
  if (a.clienteVeiculo) priv.veiculo = a.clienteVeiculo;
  if (a.endereco) priv.endereco = a.endereco;
  if (a.observacoes) priv.obs = a.observacoes.slice(0, 900);

  return {
    summary: `${STATUS_PREFIX[a.status] || ''}${a.clienteNome} – ${a.servicoTipo}`,
    location: a.endereco || undefined,
    description: lines.join('\n'),
    start: { dateTime: toLocalIso(start), timeZone: tz },
    end: { dateTime: toLocalIso(end), timeZone: tz },
    extendedProperties: { private: priv },
  };
}

interface GEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  updated?: string;
  start?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
}

function isOurEvent(ev: GEvent): boolean {
  if (ev.id.startsWith('dsc')) return true;
  if (ev.extendedProperties?.private?.dscId) return true;
  return /#dsc/i.test(`${ev.summary || ''} ${ev.description || ''}`);
}

function fromEvent(ev: GEvent, base?: Agendamento): Agendamento {
  const priv = ev.extendedProperties?.private || {};
  const now = new Date().toISOString();

  let horario = base?.horario || toLocalIso(new Date());
  if (ev.start?.dateTime) horario = toLocalIso(new Date(ev.start.dateTime));
  else if (ev.start?.date) horario = `${ev.start.date}T08:00:00`;

  let cliente: string | undefined = priv.cliente;
  let servico: string | undefined = priv.servico;
  let telefone: string | undefined = priv.telefone;
  let veiculo: string | undefined = priv.veiculo;
  let obs: string | undefined = priv.obs;
  let preco = priv.preco !== undefined ? Number(priv.preco) || 0 : base?.preco ?? 0;
  const status = (priv.status as StatusAgendamento) || base?.status || 'agendado';

  if (!priv.dscId) {
    // Evento criado à mão no Google Agenda com a marcação #Dsc
    const title = (ev.summary || '').replace(/#dsc/gi, '').replace(/^\[[^\]]+\]\s*/, '').trim();
    const parts = title.split(/\s[–-]\s/);
    cliente = parts[0]?.trim() || 'Cliente';
    servico = parts.slice(1).join(' - ').trim() || 'Serviço';
    const desc = ev.description || '';
    const pick = (label: string) => {
      const m = desc.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
      return m ? m[1].trim() : undefined;
    };
    telefone = pick('Telefone');
    veiculo = pick('Ve[ií]culo');
    const valor = pick('Valor');
    if (valor) preco = Number(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    obs = pick('Obs') || undefined;
  }

  const id = priv.dscId || (ev.id.startsWith('dsc') ? ev.id.slice(3) : `g${ev.id}`);

  return {
    id: base?.id || id,
    clienteNome: cliente || base?.clienteNome || 'Cliente',
    clienteTelefone: telefone || undefined,
    clienteVeiculo: veiculo || undefined,
    endereco: priv.endereco || ev.location || undefined,
    servicoTipo: servico || base?.servicoTipo || 'Serviço',
    horario,
    status,
    preco,
    observacoes: obs || undefined,
    isSynced: true,
    googleEventId: ev.id,
    googleUpdated: ev.updated,
    createdAt: base?.createdAt || ev.updated || now,
    updatedAt: ev.updated || now,
  };
}

// ---------------------------------------------------------------- sincronização

let running = false;
let queued = false;

function patchLocal(id: string, patch: Partial<Agendamento>, onlyIfUpdatedAt?: string): void {
  const list = storageService.getAgendamentos();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return;
  if (onlyIfUpdatedAt && list[idx].updatedAt !== onlyIfUpdatedAt) return;
  list[idx] = { ...list[idx], ...patch };
  storageService.saveAgendamentos(list);
}

async function pushOne(cal: string, a: Agendamento): Promise<GEvent> {
  const body = toEvent(a);
  const wantedId = a.googleEventId || eventIdFor(a);
  const base = `/calendars/${encodeURIComponent(cal)}/events`;

  let res: Response;
  if (a.googleEventId) {
    res = await api(`${base}/${wantedId}`, { method: 'PUT', body: { ...body, id: wantedId } });
    if (res.status === 404 || res.status === 410) {
      res = await api(base, { method: 'POST', body: { ...body, id: wantedId } });
    }
  } else {
    res = await api(base, { method: 'POST', body: { ...body, id: wantedId } });
    if (res.status === 409) {
      res = await api(`${base}/${wantedId}`, { method: 'PUT', body: { ...body, id: wantedId } });
    }
  }
  await failIfNotOk(res, `Falha ao enviar "${a.clienteNome}"`);
  return (await res.json()) as GEvent;
}

export async function syncAll(): Promise<SyncResult> {
  if (!storageService.getGoogleAuth()) {
    return { syncedCount: 0, message: 'Google Agenda não conectado. Faça login com a conta Google em Configurações.' };
  }
  if (!isNative()) {
    return { syncedCount: 0, message: 'A sincronização real só funciona no app Android instalado (APK).' };
  }
  if (!storageService.isOnline()) {
    return { syncedCount: 0, message: 'Sem internet. Os dados ficam salvos no celular e sobem quando houver conexão.' };
  }
  if (running) {
    queued = true;
    return { syncedCount: 0, message: 'Sincronização já em andamento…' };
  }

  running = true;
  const startedAt = new Date(Date.now() - 60 * 1000).toISOString();
  let pushed = 0;
  let pulled = 0;
  let removed = 0;

  try {
    const cal = await ensureCalendar();
    const calPath = `/calendars/${encodeURIComponent(cal)}/events`;

    // 1) exclusões pendentes
    const pendingDeletes = storageService.getPendingDeletes();
    const stillPending: string[] = [];
    for (const evId of pendingDeletes) {
      const res = await api(`${calPath}/${evId}`, { method: 'DELETE' });
      if (res.ok || res.status === 404 || res.status === 410) removed++;
      else stillPending.push(evId);
    }
    storageService.savePendingDeletes(stillPending);

    // 2) envio dos agendamentos novos/alterados
    const unsynced = storageService.getAgendamentos().filter((a) => !a.isSynced);
    for (const a of unsynced) {
      const ev = await pushOne(cal, a);
      patchLocal(
        a.id,
        { isSynced: true, googleEventId: ev.id, googleUpdated: ev.updated },
        a.updatedAt // só marca como sincronizado se não foi editado no meio do caminho
      );
      pushed++;
    }

    // 3) busca do que mudou no Google Agenda (outro celular ou edição manual com #Dsc)
    const since = localStorage.getItem(LAST_PULL_KEY);
    let pageToken = '';
    do {
      const qs = new URLSearchParams({ showDeleted: 'true', singleEvents: 'true', maxResults: '250' });
      if (since) qs.set('updatedMin', since);
      if (pageToken) qs.set('pageToken', pageToken);
      const res = await api(`${calPath}?${qs.toString()}`);
      await failIfNotOk(res, 'Falha ao buscar eventos');
      const data = await res.json();

      for (const ev of (data.items || []) as GEvent[]) {
        const list = storageService.getAgendamentos();
        const mine =
          list.find((x) => x.googleEventId === ev.id) || list.find((x) => eventIdFor(x) === ev.id);

        if (ev.status === 'cancelled') {
          if (mine) {
            storageService.saveAgendamentos(list.filter((x) => x.id !== mine.id));
            removed++;
          }
          continue;
        }
        if (!isOurEvent(ev)) continue;

        if (mine) {
          if (ev.updated && ev.updated === mine.googleUpdated) continue; // eco do que acabamos de enviar
          if (!mine.isSynced) continue; // alteração local pendente vence
          const merged = fromEvent(ev, mine);
          storageService.saveAgendamentos(list.map((x) => (x.id === mine.id ? merged : x)));
          pulled++;
        } else {
          storageService.saveAgendamentos([...list, fromEvent(ev)]);
          pulled++;
        }
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    localStorage.setItem(LAST_PULL_KEY, startedAt);

    const parts: string[] = [];
    if (pushed) parts.push(`${pushed} enviado(s)`);
    if (pulled) parts.push(`${pulled} recebido(s)`);
    if (removed) parts.push(`${removed} removido(s)`);
    const message = parts.length
      ? `Google Agenda sincronizado: ${parts.join(', ')}.`
      : 'Tudo já está sincronizado com o Google Agenda.';
    storageService.addSyncLog({ tipo: 'upload', detalhes: message, sucesso: true });
    return { syncedCount: pushed + pulled + removed, message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    storageService.addSyncLog({ tipo: 'error', detalhes: `Falha na sincronização: ${msg}`, sucesso: false });
    return { syncedCount: pushed + pulled + removed, message: `Falha ao sincronizar: ${msg}` };
  } finally {
    running = false;
    if (queued) {
      queued = false;
      void syncAll();
    }
  }
}
