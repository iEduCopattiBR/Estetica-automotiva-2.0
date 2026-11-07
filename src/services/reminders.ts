import { Agendamento } from '../types';

/**
 * Lembretes de agendamento (notificação do Android antes do atendimento).
 * O envio da lista para o Android é feito pela ponte "AndroidNotify" (MainActivity.java).
 */

declare global {
  interface Window {
    AndroidNotify?: {
      schedule: (json: string) => void;
      scheduleDaily: (json: string) => void;
      showNow: (id: string, title: string, text: string, big: string, channel: string) => void;
      test: () => void;
      enabled: () => boolean;
    };
  }
}

const LEAD_KEY = 'schmitt_detailer_reminder_min';
export const LEAD_OPTIONS = [0, 15, 30, 60];
const MAX_DAYS_AHEAD = 60;
const MAX_ITEMS = 100;

const DAILY_ENABLED_KEY = 'schmitt_detailer_daily_enabled';
const DAILY_TIME_KEY = 'schmitt_detailer_daily_time';
const DAILY_DAYS_AHEAD = 30;

export function isAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.AndroidNotify;
}

export function getLeadMinutes(): number {
  try {
    const raw = localStorage.getItem(LEAD_KEY);
    if (raw === null) return 30;
    const n = Number(raw);
    return LEAD_OPTIONS.includes(n) ? n : 30;
  } catch {
    return 30;
  }
}

export function setLeadMinutes(minutes: number): void {
  try {
    localStorage.setItem(LEAD_KEY, String(minutes));
  } catch {
    /* ignore */
  }
}

export function notificationsEnabled(): boolean {
  try {
    return isAvailable() ? !!window.AndroidNotify!.enabled() : false;
  } catch {
    return false;
  }
}

export function sendTest(): void {
  if (isAvailable()) window.AndroidNotify!.test();
}

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function buildReminders(list: Agendamento[], leadMinutes: number, nowMs: number = Date.now()) {
  if (leadMinutes <= 0) return [];
  const limit = nowMs + MAX_DAYS_AHEAD * 24 * 3600 * 1000;

  return list
    .filter((a) => a.status === 'agendado')
    .map((a) => {
      const start = new Date(a.horario);
      const horario = hhmm(start);
      const endereco = a.endereco && a.endereco.trim() ? a.endereco.trim() : 'endereço não informado';
      const big = [
        `Cliente: ${a.clienteNome}`,
        `Endereço: ${endereco}`,
        a.clienteVeiculo ? `Veículo: ${a.clienteVeiculo}` : '',
        a.clienteTelefone ? `Telefone: ${a.clienteTelefone}` : '',
        `Serviço: ${a.servicoTipo}`,
        `Horário: ${horario} (em ${leadMinutes} min)`,
      ]
        .filter(Boolean)
        .join('\n');
      return {
        id: a.id,
        at: start.getTime() - leadMinutes * 60 * 1000,
        title: `Atendimento às ${horario} – ${a.servicoTipo}`,
        text: `${a.clienteNome} • ${endereco}`,
        big,
      };
    })
    .filter((x) => !Number.isNaN(x.at) && x.at > nowMs && x.at < limit)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_ITEMS);
}

// ---------------------------------------------------------------- resumo do dia

export function getDailyEnabled(): boolean {
  try {
    const raw = localStorage.getItem(DAILY_ENABLED_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function setDailyEnabled(on: boolean): void {
  try {
    localStorage.setItem(DAILY_ENABLED_KEY, String(on));
  } catch {
    /* ignore */
  }
}

export function getDailyTime(): string {
  try {
    const raw = localStorage.getItem(DAILY_TIME_KEY);
    return raw && /^\d{2}:\d{2}$/.test(raw) ? raw : '07:00';
  } catch {
    return '07:00';
  }
}

export function setDailyTime(time: string): void {
  if (!/^\d{2}:\d{2}$/.test(time)) return;
  try {
    localStorage.setItem(DAILY_TIME_KEY, time);
  } catch {
    /* ignore */
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function summaryTexts(dayList: Agendamento[]) {
  const lines = dayList.map(
    (a) => `${hhmm(new Date(a.horario))} – ${a.clienteNome} – ${a.servicoTipo}`
  );
  const n = lines.length;
  return {
    title: n === 1 ? 'Hoje: 1 atendimento' : `Hoje: ${n} atendimentos`,
    text: lines[0] + (n > 1 ? ` (+${n - 1})` : ''),
    big: lines.join('\n'),
  };
}

/** Um resumo por dia (nos próximos dias), no horário escolhido. Dias sem atendimento não geram aviso. */
export function buildDailySummaries(
  list: Agendamento[],
  time: string,
  nowMs: number = Date.now(),
  days: number = DAILY_DAYS_AHEAD
) {
  const [hh, mm] = time.split(':').map(Number);
  const active = list.filter((a) => a.status === 'agendado' || a.status === 'em_andamento');
  const result: { id: string; at: number; title: string; text: string; big: string; channel: string }[] = [];

  const today = new Date(nowMs);
  for (let i = 0; i < days; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i, hh, mm, 0, 0);
    const at = day.getTime();
    if (at <= nowMs) continue;

    const key = dayKey(day);
    const dayList = active
      .filter((a) => !Number.isNaN(new Date(a.horario).getTime()) && dayKey(new Date(a.horario)) === key)
      .sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());
    if (dayList.length === 0) continue;

    result.push({ id: `daily-${key}`, at, channel: 'resumo', ...summaryTexts(dayList) });
  }
  return result;
}

/** Mostra agora o resumo de hoje (ou um exemplo, se não houver atendimento) para testar. */
export function sendDailyTest(list: Agendamento[]): void {
  if (!isAvailable()) return;
  const key = dayKey(new Date());
  const dayList = list
    .filter((a) => (a.status === 'agendado' || a.status === 'em_andamento') && dayKey(new Date(a.horario)) === key)
    .sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());

  if (dayList.length === 0) {
    window.AndroidNotify!.showNow(
      'daily-test',
      'Hoje: 2 atendimentos',
      '08:00 – João Silva – Higienização (+1)',
      '08:00 – João Silva – Higienização\n14:30 – Maria Souza – Polimento\n\n(Exemplo: hoje você não tem atendimentos agendados)',
      'resumo'
    );
    return;
  }
  const t = summaryTexts(dayList);
  window.AndroidNotify!.showNow('daily-test', t.title, t.text, t.big, 'resumo');
}

/** Reenvia ao Android as listas atuais de lembretes e de resumo do dia (substituem as anteriores). */
export function scheduleReminders(list: Agendamento[]): void {
  if (!isAvailable()) return;
  try {
    const items = buildReminders(list, getLeadMinutes());
    window.AndroidNotify!.schedule(JSON.stringify(items));
  } catch {
    /* ignore */
  }
  try {
    const daily = getDailyEnabled() ? buildDailySummaries(list, getDailyTime()) : [];
    window.AndroidNotify!.scheduleDaily(JSON.stringify(daily));
  } catch {
    /* ignore */
  }
}
