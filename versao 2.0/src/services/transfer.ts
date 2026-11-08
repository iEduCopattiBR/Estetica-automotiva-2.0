import { storageService } from './storageService';
import { Cliente, Produto, TipoServico } from '../types';

/**
 * Plano B: copia todos os cadastros (clientes, insumos e serviços) como um texto, que pode ser enviado
 * por WhatsApp para o outro celular e colado lá. Funciona sem Google Agenda e sem internet.
 */

const PREFIX = 'SCHMITT-CADASTROS:';

const toB64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
};

const fromB64 = (b64: string): string => {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function exportCadastros(): string {
  const data = {
    v: 1,
    clientes: storageService.getClientesRaw(),
    produtos: storageService.getProdutos(),
    servicos: storageService.getTiposServico(),
  };
  return PREFIX + toB64(JSON.stringify(data));
}

function mergeById<T extends { id: string }>(local: T[], incoming: T[]) {
  const list = [...local];
  let added = 0;
  let updated = 0;
  for (const item of incoming) {
    if (!item || typeof item.id !== 'string') continue;
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx === -1) {
      list.push(item);
      added++;
    } else if (JSON.stringify(list[idx]) !== JSON.stringify(item)) {
      list[idx] = item;
      updated++;
    }
  }
  return { list, added, updated };
}

export interface ImportResult {
  clientes: number;
  produtos: number;
  servicos: number;
}

/** Junta os cadastros recebidos com os deste celular (nada é apagado). Lança erro se o texto for inválido. */
export function importCadastros(text: string): ImportResult {
  const trimmed = text.trim();
  const body = (trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed).replace(/\s+/g, '');
  if (!body) throw new Error('Cole primeiro o texto copiado do outro celular.');

  let data: { clientes?: Cliente[]; produtos?: Produto[]; servicos?: TipoServico[] };
  try {
    data = JSON.parse(fromB64(body));
  } catch {
    throw new Error('Esse texto não parece ser de cadastros copiados do app. Copie de novo no outro celular.');
  }

  const result: ImportResult = { clientes: 0, produtos: 0, servicos: 0 };

  if (Array.isArray(data.clientes)) {
    const m = mergeById(storageService.getClientesRaw(), data.clientes);
    if (m.added + m.updated > 0) storageService.saveClientesRaw(m.list);
    result.clientes = m.added + m.updated;
  }
  if (Array.isArray(data.produtos)) {
    const m = mergeById(storageService.getProdutos(), data.produtos);
    if (m.added + m.updated > 0) storageService.saveProdutos(m.list);
    result.produtos = m.added + m.updated;
  }
  if (Array.isArray(data.servicos)) {
    const m = mergeById(storageService.getTiposServico(), data.servicos);
    if (m.added + m.updated > 0) storageService.saveTiposServico(m.list);
    result.servicos = m.added + m.updated;
  }
  return result;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
