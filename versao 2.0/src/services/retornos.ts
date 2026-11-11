import { Agendamento, Cliente, TipoServico } from '../types';
import { storageService } from './storageService';

/**
 * Lembretes de retorno: depois de N dias de um serviço concluído (N definido no tipo de serviço),
 * o app avisa e prepara uma mensagem de WhatsApp para o cliente. O envio é feito pela pessoa,
 * tocando em "Enviar" dentro do WhatsApp.
 *
 * Os lembretes são CALCULADOS a partir dos agendamentos concluídos; só o estado de cada um
 * (enviado, adiado, dispensado) é guardado neste aparelho.
 */

const ESTADO_KEY = 'schmitt_detailer_retornos_estado';
const MSG_KEY = 'schmitt_detailer_retornos_msg';
const DIA_MS = 24 * 3600 * 1000;
const HORA_AVISO = 9; // notificação às 09:00 do dia do lembrete
const MAX_DIAS_NOTIFICACAO = 60;

export const MENSAGEM_PADRAO =
  'Olá, {nome}! Já faz {dias} dias desde o seu serviço de {servico}{veiculo}. ' +
  'Que tal agendar uma nova? Qualquer dúvida é só me chamar. 😊';

export type EstadoRetorno =
  | { status: 'enviado'; em: string }
  | { status: 'dispensado'; em: string }
  | { status: 'adiado'; ate: string };

export interface Retorno {
  id: string; // = id do agendamento de origem
  agendamentoId: string;
  clienteNome: string;
  telefone: string; // só dígitos, com 55; vazio se não houver
  veiculo?: string;
  servico: string;
  dataServico: string; // ISO
  dataLembrete: string; // ISO (já considera adiamento)
  dias: number;
  diasDesdeServico: number;
}

// ------------------------------------------------------------------ armazenamento local

const memoria: Record<string, string> = {};

function ler(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* ignore */
  }
  return memoria[key] ?? null;
}

function gravar(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    return;
  } catch {
    /* ignore */
  }
  memoria[key] = value;
}

export function getEstados(): Record<string, EstadoRetorno> {
  const raw = ler(ESTADO_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setEstados(map: Record<string, EstadoRetorno>): void {
  gravar(ESTADO_KEY, JSON.stringify(map));
}

export function marcarEnviado(id: string): void {
  const m = getEstados();
  m[id] = { status: 'enviado', em: new Date().toISOString() };
  setEstados(m);
}

export function dispensar(id: string): void {
  const m = getEstados();
  m[id] = { status: 'dispensado', em: new Date().toISOString() };
  setEstados(m);
}

export function adiar(id: string, dias: number): void {
  const m = getEstados();
  m[id] = { status: 'adiado', ate: new Date(Date.now() + dias * DIA_MS).toISOString() };
  setEstados(m);
}

export function desfazer(id: string): void {
  const m = getEstados();
  delete m[id];
  setEstados(m);
}

export function getMensagem(): string {
  const raw = ler(MSG_KEY);
  return raw && raw.trim() ? raw : MENSAGEM_PADRAO;
}

export function setMensagem(texto: string): void {
  gravar(MSG_KEY, texto);
}

// ------------------------------------------------------------------ cálculo

const norm = (t: string | undefined) => (t || '').trim().toLowerCase();

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Deixa só dígitos e garante o código do Brasil (55). Retorna '' se o número não parecer válido. */
export function normalizarTelefone(tel: string | undefined): string {
  const digitos = (tel || '').replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) return '55' + digitos;
  if (digitos.length >= 12 && digitos.startsWith('55')) return digitos;
  return '';
}

function calcular(
  agendamentos: Agendamento[],
  tipos: TipoServico[],
  clientes: Cliente[],
  estados: Record<string, EstadoRetorno>,
  nowMs: number
): Retorno[] {
  const diasPorServico = new Map<string, number>();
  tipos.forEach((t) => {
    if (t.lembreteDias && t.lembreteDias > 0) diasPorServico.set(norm(t.nome), t.lembreteDias);
  });
  if (diasPorServico.size === 0) return [];

  const telPorNome = new Map<string, string>();
  clientes.forEach((c) => telPorNome.set(norm(c.nome), c.telefone));

  const ativos = agendamentos.filter((a) => a.status !== 'cancelado');
  const resultado: Retorno[] = [];

  for (const a of agendamentos) {
    if (a.status !== 'concluido') continue;
    const dias = diasPorServico.get(norm(a.servicoTipo));
    if (!dias) continue;

    const estado = estados[a.id];
    if (estado && (estado.status === 'enviado' || estado.status === 'dispensado')) continue;

    const dataServico = new Date(a.horario);
    if (Number.isNaN(dataServico.getTime())) continue;

    // Se o cliente já tem um atendimento mais novo (agendado ou feito), o lembrete perde o sentido.
    const temMaisNovo = ativos.some(
      (o) =>
        o.id !== a.id &&
        norm(o.clienteNome) === norm(a.clienteNome) &&
        new Date(o.horario).getTime() > dataServico.getTime()
    );
    if (temMaisNovo) continue;

    let vencimento = inicioDoDia(new Date(dataServico.getTime() + dias * DIA_MS));
    if (estado && estado.status === 'adiado') {
      const ate = new Date(estado.ate);
      if (!Number.isNaN(ate.getTime())) vencimento = inicioDoDia(ate);
    }

    resultado.push({
      id: a.id,
      agendamentoId: a.id,
      clienteNome: a.clienteNome,
      telefone: normalizarTelefone(a.clienteTelefone || telPorNome.get(norm(a.clienteNome))),
      veiculo: a.clienteVeiculo,
      servico: a.servicoTipo,
      dataServico: dataServico.toISOString(),
      dataLembrete: vencimento.toISOString(),
      dias,
      diasDesdeServico: Math.max(0, Math.floor((nowMs - dataServico.getTime()) / DIA_MS)),
    });
  }

  return resultado.sort((x, y) => new Date(x.dataLembrete).getTime() - new Date(y.dataLembrete).getTime());
}

export interface ListaRetornos {
  paraEnviar: Retorno[]; // vencem hoje ou já venceram
  proximos: Retorno[]; // ainda vão vencer
  enviados: { retorno: Retorno; em: string }[]; // últimos enviados (para desfazer)
}

export function listarRetornos(
  agendamentos: Agendamento[] = storageService.getAgendamentos(),
  nowMs: number = Date.now()
): ListaRetornos {
  const tipos = storageService.getTiposServico();
  const clientes = storageService.getClientesRaw();
  const estados = getEstados();

  const pendentes = calcular(agendamentos, tipos, clientes, estados, nowMs);
  const fimDeHoje = inicioDoDia(new Date(nowMs)).getTime() + DIA_MS;

  const paraEnviar = pendentes.filter((r) => new Date(r.dataLembrete).getTime() < fimDeHoje);
  const proximos = pendentes.filter((r) => new Date(r.dataLembrete).getTime() >= fimDeHoje);

  // Enviados: recalcula ignorando o estado "enviado" só para montar os dados de exibição
  const idsEnviados = Object.keys(estados)
    .filter((id) => estados[id].status === 'enviado')
    .sort((a, b) => {
      const ea = estados[a] as { em: string };
      const eb = estados[b] as { em: string };
      return new Date(eb.em).getTime() - new Date(ea.em).getTime();
    })
    .slice(0, 10);

  const semEnviados: Record<string, EstadoRetorno> = { ...estados };
  idsEnviados.forEach((id) => delete semEnviados[id]);
  const todos = calcular(agendamentos, tipos, clientes, semEnviados, nowMs);
  const enviados = idsEnviados
    .map((id) => {
      const r = todos.find((x) => x.id === id);
      return r ? { retorno: r, em: (estados[id] as { em: string }).em } : null;
    })
    .filter((x): x is { retorno: Retorno; em: string } => x !== null);

  return { paraEnviar, proximos, enviados };
}

export function contarParaEnviar(agendamentos?: Agendamento[]): number {
  try {
    return listarRetornos(agendamentos).paraEnviar.length;
  } catch {
    return 0;
  }
}

// ------------------------------------------------------------------ mensagem e WhatsApp

export function montarMensagem(r: Retorno, template: string = getMensagem()): string {
  const primeiroNome = (r.clienteNome || '').trim().split(/\s+/)[0] || 'tudo bem';
  const veiculo = r.veiculo && r.veiculo.trim() ? ` no seu ${r.veiculo.trim()}` : '';
  return template
    .replace(/\{nome\}/g, primeiroNome)
    .replace(/\{dias\}/g, String(Math.max(r.diasDesdeServico, r.dias)))
    .replace(/\{servico\}/g, r.servico)
    .replace(/\{veiculo\}/g, veiculo);
}

export function urlWhatsApp(telefone: string, mensagem: string): string {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

/** Mostra o número como +55 54 99999-1234 (para a pessoa conferir para quem vai a mensagem). */
export function formatarTelefone(digitos: string): string {
  const d = digitos.startsWith('55') ? digitos.slice(2) : digitos;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const corte = resto.length > 8 ? 5 : 4;
  return `+55 ${ddd} ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export type TipoWhatsApp = 'auto' | 'whatsapp' | 'business';
const WA_TIPO_KEY = 'schmitt_detailer_whatsapp_tipo';

export function getTipoWhatsApp(): TipoWhatsApp {
  const v = ler(WA_TIPO_KEY);
  return v === 'whatsapp' || v === 'business' ? v : 'auto';
}

export function setTipoWhatsApp(tipo: TipoWhatsApp): void {
  gravar(WA_TIPO_KEY, tipo);
}

declare global {
  interface Window {
    AndroidWhatsApp?: {
      open(phone: string, message: string, preferred: string): boolean;
    };
  }
}

/**
 * Abre a conversa do WhatsApp no número do cliente, com a mensagem pronta.
 * Retorna false se não foi possível abrir (WhatsApp não instalado, número inválido...).
 */
export function abrirWhatsApp(telefone: string, mensagem: string): boolean {
  if (typeof window === 'undefined') return false;

  if (window.AndroidWhatsApp) {
    try {
      return window.AndroidWhatsApp.open(telefone, mensagem, getTipoWhatsApp());
    } catch {
      return false;
    }
  }

  const url = urlWhatsApp(telefone, mensagem);
  if (window.AndroidNotify) {
    window.location.href = url;
    return true;
  }
  window.open(url, '_blank', 'noopener');
  return true;
}

// ------------------------------------------------------------------ notificações do Android

/** Avisos às 09:00 do dia de cada lembrete (apenas os dos próximos 60 dias; reenviados a cada abertura do app). */
export function buildRetornoNotifications(
  agendamentos: Agendamento[],
  nowMs: number = Date.now()
): { id: string; at: number; title: string; text: string; big: string }[] {
  const limite = nowMs + MAX_DIAS_NOTIFICACAO * DIA_MS;
  const lista = listarRetornos(agendamentos, nowMs);
  const todos = [...lista.paraEnviar, ...lista.proximos];

  return todos
    .map((r) => {
      const dia = new Date(r.dataLembrete);
      const at = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), HORA_AVISO, 0, 0, 0).getTime();
      return {
        id: `retorno-${r.id}`,
        at,
        title: 'Lembrete de retorno',
        text: `${r.clienteNome} • ${r.servico}`,
        big: [
          `Cliente: ${r.clienteNome}`,
          `Serviço: ${r.servico}`,
          r.veiculo ? `Veículo: ${r.veiculo}` : '',
          `Feito há ${Math.max(r.diasDesdeServico, r.dias)} dias`,
          'Abra o app > Lembretes de retorno para enviar a mensagem no WhatsApp.',
        ]
          .filter((l) => l !== '')
          .join('\n'),
      };
    })
    .filter((x) => !Number.isNaN(x.at) && x.at > nowMs && x.at < limite)
    .sort((a, b) => a.at - b.at)
    .slice(0, 50);
}
