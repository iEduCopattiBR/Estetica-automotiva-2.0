import { PdfDoc, PAGE_W, PAGE_H, RGB, bytesToBase64 } from './pdfBuilder';

export interface OrcamentoItem {
  nome: string;
  descricao?: string;
  valor: number;
}

export interface OrcamentoDados {
  numero: string;
  emissao: Date;
  validadeDias: number;
  cliente: {
    nome: string;
    telefone?: string;
    endereco?: string;
    veiculo?: string;
    placa?: string;
  };
  dataServico?: string; // yyyy-mm-dd
  itens: OrcamentoItem[];
  desconto: number;
  formaPagamento?: string;
  observacoes?: string;
  contatoEmpresa?: string;
}

declare global {
  interface Window {
    AndroidPdf?: {
      savePdf(base64: string, fileName: string, share: boolean): boolean;
    };
  }
}

// ------------------------------------------------------------------ utilidades

const VERMELHO: RGB = [229, 9, 20];
const PRETO: RGB = [10, 10, 12];
const TEXTO: RGB = [28, 28, 32];
const CINZA: RGB = [110, 110, 120];
const CINZA_CLARO: RGB = [244, 244, 246];
const LINHA: RGB = [226, 226, 230];
const BRANCO: RGB = [255, 255, 255];

export function formatarMoeda(v: number): string {
  const n = Number.isFinite(v) ? v : 0;
  const [inteiro, frac] = Math.abs(n).toFixed(2).split('.');
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}R$ ${milhar},${frac}`;
}

const dois = (n: number) => String(n).padStart(2, '0');

export function formatarData(d: Date): string {
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Converte "2026-11-20" em "20/11/2026" sem passar por fuso horário. */
export function formatarDataISO(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export function somarDias(d: Date, dias: number): Date {
  const r = new Date(d.getTime());
  r.setDate(r.getDate() + dias);
  return r;
}

export function calcularTotais(d: Pick<OrcamentoDados, 'itens' | 'desconto'>) {
  const subtotal = d.itens.reduce((acc, i) => acc + (Number.isFinite(i.valor) ? i.valor : 0), 0);
  const desconto = Math.min(Math.max(d.desconto || 0, 0), subtotal);
  return { subtotal, desconto, total: subtotal - desconto };
}

export function gerarNumeroOrcamento(agora: Date = new Date()): string {
  return `ORC-${agora.getFullYear()}${dois(agora.getMonth() + 1)}${dois(agora.getDate())}-${dois(agora.getHours())}${dois(agora.getMinutes())}`;
}

export function nomeArquivo(d: OrcamentoDados): string {
  const nome = d.cliente.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  const data = `${d.emissao.getFullYear()}${dois(d.emissao.getMonth() + 1)}${dois(d.emissao.getDate())}`;
  return `Orcamento_${nome || 'cliente'}_${data}.pdf`;
}

// ------------------------------------------------------------------ desenho

const MARGEM = 40;
const LARGURA = PAGE_W - MARGEM * 2;
const LIMITE_INFERIOR = PAGE_H - 95; // reserva o rodapé

/** Logotipo: o mesmo desenho (SCHMITT / DETAILER) da tela inicial do app. */
function desenharLogo(doc: PdfDoc): void {
  doc.rect(0, 0, PAGE_W, 122, PRETO);
  const cx = PAGE_W / 2;

  const wSchmitt = doc.measure('SCHMITT', 34, true);
  doc.text('SCHMITT', cx, 58, { size: 34, bold: true, italic: true, color: BRANCO, align: 'center' });
  const gap = 14;
  const traco = 44;
  doc.rect(cx - wSchmitt / 2 - gap - traco, 46, traco, 2, VERMELHO);
  doc.rect(cx + wSchmitt / 2 + gap, 46, traco, 2, VERMELHO);

  doc.text('DETAILER', cx, 90, { size: 30, bold: true, color: VERMELHO, align: 'center', charSpacing: 5 });
  doc.text('ESTÉTICA AUTOMOTIVA', cx, 109, {
    size: 7.5,
    bold: true,
    color: [161, 161, 170],
    align: 'center',
    charSpacing: 3.2,
  });
  doc.rect(0, 122, PAGE_W, 3, VERMELHO);
}

function cabecalhoContinuacao(doc: PdfDoc, numero: string): number {
  doc.rect(0, 0, PAGE_W, 34, PRETO);
  doc.text('SCHMITT', MARGEM, 22, { size: 13, bold: true, italic: true, color: BRANCO, charSpacing: 1 });
  const w = doc.measure('SCHMITT', 13, true, 1);
  doc.text('DETAILER', MARGEM + w + 6, 22, { size: 13, bold: true, color: VERMELHO, charSpacing: 2 });
  doc.text(`Orçamento ${numero}`, PAGE_W - MARGEM, 22, { size: 9, color: [200, 200, 205], align: 'right' });
  doc.rect(0, 34, PAGE_W, 2, VERMELHO);
  return 58;
}

function cabecalhoTabela(doc: PdfDoc, y: number): number {
  doc.rect(MARGEM, y, LARGURA, 24, PRETO);
  doc.text('SERVIÇO', MARGEM + 12, y + 16, { size: 9, bold: true, color: BRANCO, charSpacing: 1 });
  doc.text('VALOR', MARGEM + LARGURA - 12, y + 16, {
    size: 9,
    bold: true,
    color: BRANCO,
    align: 'right',
    charSpacing: 1,
  });
  return y + 24;
}

export function gerarOrcamentoPdf(d: OrcamentoDados): Uint8Array {
  const doc = new PdfDoc();
  doc.title = `Orçamento ${d.numero} - ${d.cliente.nome}`;
  doc.author = 'Schmitt Detailer';

  const validoAte = somarDias(d.emissao, Math.max(1, d.validadeDias || 1));

  desenharLogo(doc);

  // Título e dados do orçamento
  let y = 162;
  doc.text('ORÇAMENTO', MARGEM, y + 10, { size: 24, bold: true, color: TEXTO });
  doc.text(`Nº ${d.numero}`, PAGE_W - MARGEM, y, { size: 10, bold: true, color: TEXTO, align: 'right' });
  doc.text(`Emissão: ${formatarData(d.emissao)}`, PAGE_W - MARGEM, y + 14, { size: 9.5, color: CINZA, align: 'right' });
  doc.text(`Válido até: ${formatarData(validoAte)}`, PAGE_W - MARGEM, y + 27, { size: 9.5, color: CINZA, align: 'right' });
  y += 46;

  // Cliente
  const linhasCliente: string[] = [];
  if (d.cliente.telefone) linhasCliente.push(`Telefone: ${d.cliente.telefone}`);
  const veic = [d.cliente.veiculo, d.cliente.placa ? `placa ${d.cliente.placa}` : ''].filter(Boolean).join(' • ');
  if (veic) linhasCliente.push(`Veículo: ${veic}`);
  const linhasEnd = d.cliente.endereco ? doc.wrap(`Endereço: ${d.cliente.endereco}`, LARGURA - 28, 10) : [];
  const alturaCliente = 18 + 18 + (linhasCliente.length + linhasEnd.length) * 14 + 12;
  doc.rect(MARGEM, y, LARGURA, alturaCliente, CINZA_CLARO);
  doc.rect(MARGEM, y, 3, alturaCliente, VERMELHO);
  doc.text('CLIENTE', MARGEM + 14, y + 16, { size: 8, bold: true, color: VERMELHO, charSpacing: 1.5 });
  doc.text(d.cliente.nome, MARGEM + 14, y + 34, { size: 13, bold: true, color: TEXTO });
  let cy = y + 50;
  for (const l of linhasCliente) {
    doc.text(l, MARGEM + 14, cy, { size: 10, color: TEXTO });
    cy += 14;
  }
  for (const l of linhasEnd) {
    doc.text(l, MARGEM + 14, cy, { size: 10, color: TEXTO });
    cy += 14;
  }
  y += alturaCliente + 14;

  if (d.dataServico) {
    doc.text('Data prevista do serviço:', MARGEM, y + 10, { size: 10, bold: true, color: TEXTO });
    const w = doc.measure('Data prevista do serviço:', 10, true);
    doc.text(formatarDataISO(d.dataServico), MARGEM + w + 6, y + 10, { size: 10, color: TEXTO });
    y += 28;
  } else {
    y += 4;
  }

  // Tabela de serviços
  y = cabecalhoTabela(doc, y);
  const larguraNome = LARGURA - 24 - 120;
  d.itens.forEach((item, idx) => {
    const nomeLinhas = doc.wrap(item.nome, larguraNome, 11, true);
    const descLinhas = item.descricao ? doc.wrap(item.descricao, larguraNome, 9) : [];
    const altura = 14 + nomeLinhas.length * 14 + descLinhas.length * 12 + 4;

    if (y + altura > LIMITE_INFERIOR) {
      doc.addPage();
      y = cabecalhoContinuacao(doc, d.numero);
      y = cabecalhoTabela(doc, y);
    }

    if (idx % 2 === 1) doc.rect(MARGEM, y, LARGURA, altura, [250, 250, 251]);
    let ty = y + 18;
    for (const l of nomeLinhas) {
      doc.text(l, MARGEM + 12, ty, { size: 11, bold: true, color: TEXTO });
      ty += 14;
    }
    for (const l of descLinhas) {
      doc.text(l, MARGEM + 12, ty - 1, { size: 9, color: CINZA });
      ty += 12;
    }
    doc.text(formatarMoeda(item.valor), MARGEM + LARGURA - 12, y + 18, {
      size: 11,
      bold: true,
      color: TEXTO,
      align: 'right',
    });
    y += altura;
    doc.line(MARGEM, y, MARGEM + LARGURA, y, LINHA, 0.6);
  });

  // Totais
  const { subtotal, desconto, total } = calcularTotais(d);
  const alturaTotais = 22 + (desconto > 0 ? 40 : 0) + 38;
  if (y + alturaTotais + 20 > LIMITE_INFERIOR) {
    doc.addPage();
    y = cabecalhoContinuacao(doc, d.numero);
  }
  y += 14;
  const bx = MARGEM + LARGURA - 230;
  if (desconto > 0) {
    doc.text('Subtotal', bx + 12, y + 12, { size: 10, color: CINZA });
    doc.text(formatarMoeda(subtotal), bx + 218, y + 12, { size: 10, color: TEXTO, align: 'right' });
    doc.text('Desconto', bx + 12, y + 30, { size: 10, color: CINZA });
    doc.text(`- ${formatarMoeda(desconto)}`, bx + 218, y + 30, { size: 10, color: TEXTO, align: 'right' });
    y += 42;
  }
  doc.rect(bx, y, 230, 36, VERMELHO);
  doc.text('TOTAL', bx + 14, y + 23, { size: 12, bold: true, color: BRANCO, charSpacing: 1.5 });
  doc.text(formatarMoeda(total), bx + 216, y + 24, { size: 15, bold: true, color: BRANCO, align: 'right' });
  y += 36 + 22;

  // Pagamento e observações
  const blocos: { titulo: string; texto: string }[] = [];
  if (d.formaPagamento && d.formaPagamento.trim()) blocos.push({ titulo: 'FORMA DE PAGAMENTO', texto: d.formaPagamento.trim() });
  if (d.observacoes && d.observacoes.trim()) blocos.push({ titulo: 'OBSERVAÇÕES', texto: d.observacoes.trim() });
  blocos.push({
    titulo: 'CONDIÇÕES',
    texto: `Orçamento válido por ${Math.max(1, d.validadeDias || 1)} dias a partir da data de emissão. Os valores podem ser reajustados após a avaliação do veículo.`,
  });

  for (const b of blocos) {
    const linhas = doc.wrap(b.texto, LARGURA, 10);
    const altura = 18 + linhas.length * 13 + 10;
    if (y + altura > LIMITE_INFERIOR) {
      doc.addPage();
      y = cabecalhoContinuacao(doc, d.numero);
    }
    doc.text(b.titulo, MARGEM, y + 8, { size: 8, bold: true, color: VERMELHO, charSpacing: 1.5 });
    let ty = y + 24;
    for (const l of linhas) {
      doc.text(l, MARGEM, ty, { size: 10, color: TEXTO });
      ty += 13;
    }
    y += altura;
  }

  // Rodapé em todas as páginas
  const total_paginas = doc.pageCount;
  for (let p = 0; p < total_paginas; p++) {
    doc.usePage(p);
    doc.line(MARGEM, PAGE_H - 66, PAGE_W - MARGEM, PAGE_H - 66, LINHA, 0.8);
    if (d.contatoEmpresa && d.contatoEmpresa.trim()) {
      doc.text(d.contatoEmpresa.trim(), PAGE_W / 2, PAGE_H - 50, { size: 9, color: TEXTO, align: 'center' });
    }
    doc.text('SCHMITT DETAILER • Estética Automotiva', MARGEM, PAGE_H - 32, { size: 8, color: CINZA });
    doc.text(`Página ${p + 1} de ${total_paginas}`, PAGE_W - MARGEM, PAGE_H - 32, { size: 8, color: CINZA, align: 'right' });
  }

  return doc.toBytes();
}

// ------------------------------------------------------------------ entrega do arquivo

/**
 * No app Android: salva em Downloads/Schmitt Detailer e abre o menu de compartilhar (WhatsApp, Drive...).
 * No navegador: baixa o arquivo.
 */
export function entregarPdf(bytes: Uint8Array, fileName: string): 'android' | 'download' | 'erro' {
  if (typeof window !== 'undefined' && window.AndroidPdf) {
    try {
      return window.AndroidPdf.savePdf(bytesToBase64(bytes), fileName, true) ? 'android' : 'erro';
    } catch {
      return 'erro';
    }
  }
  try {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'download';
  } catch {
    return 'erro';
  }
}
