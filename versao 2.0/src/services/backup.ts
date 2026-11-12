import { storageService } from './storageService';
import { bytesToBase64 } from './pdfBuilder';
import type {} from './orcamentoPdf'; // traz a tipagem global de window.AndroidPdf

/**
 * Backup e restauração de todos os dados do app.
 *
 * O backup é um arquivo .json com os clientes, agendamentos, serviços, produtos e as configurações
 * (mensagem de lembrete, horários dos avisos etc.). Nunca entram no arquivo: o login do Google,
 * registros de sincronização e exclusões pendentes.
 */

export interface ArmazenamentoBruto {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

const armazenamentoPadrao: ArmazenamentoBruto = {
  get: (k) => storageService.getRawItem(k),
  set: (k, v) => storageService.setRawItem(k, v),
  remove: (k) => storageService.removeRawItem(k),
};

/** Listas de dados: se o backup não tiver alguma delas, ela fica vazia após restaurar. */
const CHAVES_LISTAS = [
  'schmitt_detailer_clientes',
  'schmitt_detailer_agendamentos',
  'schmitt_detailer_produtos',
  'schmitt_detailer_tipos_servico',
];

/** Configurações: se o backup não tiver alguma delas, ela volta ao padrão após restaurar. */
const CHAVES_CONFIG = [
  'schmitt_detailer_retornos_estado',
  'schmitt_detailer_retornos_msg',
  'schmitt_detailer_whatsapp_tipo',
  'schmitt_detailer_orcamento_contato',
  'schmitt_detailer_reminder_min',
  'schmitt_detailer_daily_enabled',
  'schmitt_detailer_daily_time',
];

export const CHAVES_BACKUP = [...CHAVES_LISTAS, ...CHAVES_CONFIG];

const CHAVE_ULTIMO_BACKUP = 'schmitt_detailer_ultimo_backup';
const CHAVE_ANTES_DA_RESTAURACAO = 'schmitt_detailer_pre_restore';
const CHAVE_ZERO_SLATE = 'schmitt_detailer_zero_slate_v3';
const TAMANHO_MAXIMO = 20 * 1024 * 1024;

export interface ArquivoBackup {
  app: 'schmitt-detailer';
  formato: 1;
  criadoEm: string;
  itens: Record<string, string>;
}

export interface ResumoBackup {
  criadoEm: string;
  clientes: number;
  agendamentos: number;
  servicos: number;
  produtos: number;
}

export type ResultadoLeitura =
  | { ok: true; backup: ArquivoBackup; resumo: ResumoBackup }
  | { ok: false; erro: string };

// ------------------------------------------------------------------ criar

export function criarBackup(arm: ArmazenamentoBruto = armazenamentoPadrao, agora: Date = new Date()): ArquivoBackup {
  const itens: Record<string, string> = {};
  for (const chave of CHAVES_BACKUP) {
    const valor = arm.get(chave);
    if (typeof valor === 'string') itens[chave] = valor;
  }
  return { app: 'schmitt-detailer', formato: 1, criadoEm: agora.toISOString(), itens };
}

const dois = (n: number) => String(n).padStart(2, '0');

export function nomeArquivoBackup(agora: Date = new Date()): string {
  return (
    `Backup_SchmittDetailer_${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}` +
    `_${dois(agora.getHours())}${dois(agora.getMinutes())}.json`
  );
}

// ------------------------------------------------------------------ ler e validar

function contarLista(valor: string | undefined): number {
  if (!valor) return 0;
  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista.length : 0;
  } catch {
    return 0;
  }
}

export function lerBackup(textoOriginal: string): ResultadoLeitura {
  if (typeof textoOriginal !== 'string' || textoOriginal.length === 0) {
    return { ok: false, erro: 'O arquivo está vazio.' };
  }
  if (textoOriginal.length > TAMANHO_MAXIMO) {
    return { ok: false, erro: 'O arquivo é grande demais para ser um backup do app.' };
  }

  let dados: unknown;
  try {
    dados = JSON.parse(textoOriginal.replace(/^\uFEFF/, ''));
  } catch {
    return { ok: false, erro: 'Este arquivo não é um backup válido (não foi possível ler o conteúdo).' };
  }

  const obj = dados as Partial<ArquivoBackup> | null;
  if (!obj || typeof obj !== 'object' || obj.app !== 'schmitt-detailer') {
    return { ok: false, erro: 'Este arquivo não é um backup do Schmitt Detailer.' };
  }
  if (obj.formato !== 1) {
    return { ok: false, erro: 'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.' };
  }
  if (!obj.itens || typeof obj.itens !== 'object' || Array.isArray(obj.itens)) {
    return { ok: false, erro: 'O backup está incompleto ou danificado.' };
  }

  // Só entram as chaves conhecidas, e as listas precisam ser listas de verdade.
  const itens: Record<string, string> = {};
  for (const chave of CHAVES_BACKUP) {
    const valor = (obj.itens as Record<string, unknown>)[chave];
    if (valor === undefined) continue;
    if (typeof valor !== 'string') {
      return { ok: false, erro: 'O backup está incompleto ou danificado.' };
    }
    if (CHAVES_LISTAS.includes(chave)) {
      try {
        if (!Array.isArray(JSON.parse(valor))) throw new Error('não é lista');
      } catch {
        return { ok: false, erro: 'O backup está danificado (dados em formato inesperado).' };
      }
    }
    itens[chave] = valor;
  }

  const criadoEm = typeof obj.criadoEm === 'string' ? obj.criadoEm : '';
  const backup: ArquivoBackup = { app: 'schmitt-detailer', formato: 1, criadoEm, itens };
  return {
    ok: true,
    backup,
    resumo: {
      criadoEm,
      clientes: contarLista(itens['schmitt_detailer_clientes']),
      agendamentos: contarLista(itens['schmitt_detailer_agendamentos']),
      servicos: contarLista(itens['schmitt_detailer_tipos_servico']),
      produtos: contarLista(itens['schmitt_detailer_produtos']),
    },
  };
}

// ------------------------------------------------------------------ restaurar

function aplicar(backup: ArquivoBackup, arm: ArmazenamentoBruto): void {
  for (const chave of CHAVES_LISTAS) {
    arm.set(chave, backup.itens[chave] ?? '[]');
  }
  for (const chave of CHAVES_CONFIG) {
    const valor = backup.itens[chave];
    if (typeof valor === 'string') arm.set(chave, valor);
    else arm.remove(chave);
  }
  // Evita que a limpeza inicial do app apague os dados restaurados.
  arm.set(CHAVE_ZERO_SLATE, 'true');
}

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

/** Substitui os dados atuais pelos do backup. Antes disso guarda uma cópia dos dados atuais. */
export function restaurarBackup(
  backup: ArquivoBackup,
  arm: ArmazenamentoBruto = armazenamentoPadrao,
  agora: Date = new Date()
): ResultadoAcao {
  try {
    const copia = JSON.stringify(criarBackup(arm, agora));
    arm.set(CHAVE_ANTES_DA_RESTAURACAO, copia);
    if (arm.get(CHAVE_ANTES_DA_RESTAURACAO) !== copia) {
      return { ok: false, erro: 'Não foi possível guardar uma cópia dos dados atuais. Nada foi alterado.' };
    }
    aplicar(backup, arm);
    return { ok: true };
  } catch {
    return { ok: false, erro: 'Erro ao restaurar o backup. Confira os dados do app antes de continuar.' };
  }
}

/** Data da cópia guardada antes da última restauração (ou null se não houver). */
export function copiaAntesDaRestauracao(arm: ArmazenamentoBruto = armazenamentoPadrao): string | null {
  const bruto = arm.get(CHAVE_ANTES_DA_RESTAURACAO);
  if (!bruto) return null;
  const leitura = lerBackup(bruto);
  return leitura.ok ? leitura.backup.criadoEm : null;
}

export function desfazerRestauracao(arm: ArmazenamentoBruto = armazenamentoPadrao): ResultadoAcao {
  const bruto = arm.get(CHAVE_ANTES_DA_RESTAURACAO);
  if (!bruto) return { ok: false, erro: 'Não há restauração para desfazer.' };
  const leitura = lerBackup(bruto);
  if (!leitura.ok) return { ok: false, erro: leitura.erro };
  try {
    aplicar(leitura.backup, arm);
    arm.remove(CHAVE_ANTES_DA_RESTAURACAO);
    return { ok: true };
  } catch {
    return { ok: false, erro: 'Não foi possível desfazer a restauração.' };
  }
}

// ------------------------------------------------------------------ último backup

export function registrarUltimoBackup(arm: ArmazenamentoBruto = armazenamentoPadrao, agora: Date = new Date()): void {
  arm.set(CHAVE_ULTIMO_BACKUP, agora.toISOString());
}

export function getUltimoBackup(arm: ArmazenamentoBruto = armazenamentoPadrao): string | null {
  return arm.get(CHAVE_ULTIMO_BACKUP);
}

// ------------------------------------------------------------------ salvar o arquivo

/**
 * No Android: salva em Downloads/Schmitt Detailer e abre o menu de compartilhar (Drive, WhatsApp...).
 * No navegador: baixa o arquivo.
 */
export function entregarBackup(backup: ArquivoBackup, nome: string): 'android' | 'download' | 'atualizar' | 'erro' {
  const bytes = new TextEncoder().encode(JSON.stringify(backup));

  if (typeof window !== 'undefined' && window.AndroidPdf) {
    if (!window.AndroidPdf.saveFile) return 'atualizar';
    try {
      return window.AndroidPdf.saveFile(bytesToBase64(bytes), nome, 'application/json', true, 'Guardar backup')
        ? 'android'
        : 'erro';
    } catch {
      return 'erro';
    }
  }

  try {
    const blob = new Blob([bytes as BlobPart], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'download';
  } catch {
    return 'erro';
  }
}
