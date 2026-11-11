/**
 * Gerador de PDF mínimo, sem dependências (fontes padrão Helvetica, codificação WinAnsi).
 * Coordenadas em pontos, origem no canto superior esquerdo (y cresce para baixo). Página A4.
 */

export type RGB = [number, number, number]; // 0..255

export interface TextOpts {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: RGB;
  align?: 'left' | 'center' | 'right';
  charSpacing?: number;
}

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;

// Larguras (1/1000 de em) dos caracteres 32..255 (cp1252) da Helvetica e da Helvetica-Bold.
const W_REGULAR: number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761,
  556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
  278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
];

const W_BOLD: number[] = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761,
  556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
  278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
  611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
];

const CP1252_SPECIAL: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/** Converte texto para bytes WinAnsi (cp1252). Caracteres sem equivalente viram "?". */
export function toWinAnsi(input: string): number[] {
  const out: number[] = [];
  const s = (input || '').normalize('NFC');
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    if (cp === 0xa0) out.push(32);
    else if (cp < 32) out.push(32);
    else if (cp < 127) out.push(cp);
    else if (cp >= 161 && cp <= 255) out.push(cp);
    else if (CP1252_SPECIAL[cp] !== undefined) out.push(CP1252_SPECIAL[cp]);
    else out.push(63);
  }
  return out;
}

const num = (n: number) => (Math.round(n * 100) / 100).toString();
const col = (c: RGB) => c.map((v) => (Math.max(0, Math.min(255, v)) / 255).toFixed(3)).join(' ');
const hex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

function utf16Hex(text: string): string {
  let h = 'FEFF';
  for (let i = 0; i < text.length; i++) h += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return h;
}

export class PdfDoc {
  private pages: string[][] = [];
  private current: string[] = [];
  title = '';
  author = '';

  constructor() {
    this.addPage();
  }

  get pageCount(): number {
    return this.pages.length;
  }

  addPage(): void {
    this.current = [];
    this.pages.push(this.current);
  }

  /** Volta a escrever numa página já criada (usado para rodapés e numeração). */
  usePage(index: number): void {
    this.current = this.pages[index];
  }

  measure(text: string, size: number, bold = false, charSpacing = 0): number {
    const table = bold ? W_BOLD : W_REGULAR;
    const bytes = toWinAnsi(text);
    let w = 0;
    for (const b of bytes) w += (table[b - 32] ?? 0) * size / 1000 + charSpacing;
    return w;
  }

  rect(x: number, y: number, w: number, h: number, fill: RGB): void {
    this.current.push(`${col(fill)} rg ${num(x)} ${num(PAGE_H - y - h)} ${num(w)} ${num(h)} re f`);
  }

  strokeRect(x: number, y: number, w: number, h: number, stroke: RGB, width = 0.7): void {
    this.current.push(
      `${col(stroke)} RG ${num(width)} w ${num(x)} ${num(PAGE_H - y - h)} ${num(w)} ${num(h)} re S`
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, stroke: RGB, width = 0.7): void {
    this.current.push(
      `${col(stroke)} RG ${num(width)} w ${num(x1)} ${num(PAGE_H - y1)} m ${num(x2)} ${num(PAGE_H - y2)} l S`
    );
  }

  /** Escreve uma linha de texto com a base em y. Retorna a largura usada. */
  text(str: string, x: number, y: number, opts: TextOpts = {}): number {
    const size = opts.size ?? 11;
    const bold = !!opts.bold;
    const italic = !!opts.italic;
    const cs = opts.charSpacing ?? 0;
    const color = opts.color ?? [20, 20, 22];
    const width = this.measure(str, size, bold, cs);
    let px = x;
    if (opts.align === 'center') px = x - width / 2;
    else if (opts.align === 'right') px = x - width;
    const font = bold ? (italic ? 'F4' : 'F2') : italic ? 'F3' : 'F1';
    const bytes = toWinAnsi(str);
    if (bytes.length > 0) {
      this.current.push(
        `BT /${font} ${num(size)} Tf ${col(color)} rg ${num(cs)} Tc ${num(px)} ${num(PAGE_H - y)} Td <${hex(bytes)}> Tj ET`
      );
    }
    return width;
  }

  /** Quebra o texto em linhas que cabem em maxWidth. Respeita quebras de linha (\n). */
  wrap(str: string, maxWidth: number, size: number, bold = false): string[] {
    const lines: string[] = [];
    for (const paragraph of (str || '').split(/\r?\n/)) {
      const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 0) {
        lines.push('');
        continue;
      }
      let cur = '';
      for (let word of words) {
        // palavra maior que a linha: quebra por caracteres
        while (this.measure(word, size, bold) > maxWidth) {
          let cut = word.length - 1;
          while (cut > 1 && this.measure(word.slice(0, cut), size, bold) > maxWidth) cut--;
          if (cur) {
            lines.push(cur);
            cur = '';
          }
          lines.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        const test = cur ? cur + ' ' + word : word;
        if (this.measure(test, size, bold) <= maxWidth) cur = test;
        else {
          if (cur) lines.push(cur);
          cur = word;
        }
      }
      if (cur) lines.push(cur);
    }
    return lines;
  }

  toBytes(): Uint8Array {
    const objects: string[] = [];
    const fonts = [
      ['F1', 'Helvetica'],
      ['F2', 'Helvetica-Bold'],
      ['F3', 'Helvetica-Oblique'],
      ['F4', 'Helvetica-BoldOblique'],
    ];
    const firstFont = 4; // objetos: 1 catálogo, 2 páginas, 3 info, 4..7 fontes, depois páginas/conteúdos
    const fontRes = fonts.map(([k], i) => `/${k} ${firstFont + i} 0 R`).join(' ');
    const pageObjStart = firstFont + fonts.length; // 8

    const kids: string[] = [];
    this.pages.forEach((_, i) => kids.push(`${pageObjStart + i * 2} 0 R`));

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${this.pages.length} >>`;
    objects[3] = `<< /Title <${utf16Hex(this.title)}> /Author <${utf16Hex(this.author)}> /Producer <${utf16Hex('Schmitt Detailer')}> >>`;
    fonts.forEach(([, name], i) => {
      objects[firstFont + i] = `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
    });
    this.pages.forEach((ops, i) => {
      const pageNo = pageObjStart + i * 2;
      const contentNo = pageNo + 1;
      const stream = ops.join('\n');
      objects[pageNo] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << ${fontRes} >> >> /Contents ${contentNo} 0 R >>`;
      objects[contentNo] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    for (let n = 1; n < objects.length; n++) {
      offsets[n] = out.length;
      out += `${n} 0 obj\n${objects[n]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let n = 1; n < objects.length; n++) out += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
    out += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    // Todo o conteúdo é ASCII (textos vão em hexadecimal), então 1 caractere = 1 byte.
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
