
export type Role = 'H'|'E+'|'E-'|'R'|'C'|'D'|'T'|'M';

export type Grade =
  | 'very-strong+'|'strong+'|'moderate+'|'weak+'|'neutral'
  | 'weak-'|'moderate-'|'strong-'|'very-strong-';

export interface Statement {
  id: string;        // e.g., 'L3' (line id)
  role: Role;
  label?: string;    // e.g., 'H1' if provided
  text: string;
  meta: Record<string, any>;
  line: number;
}

export interface ParseResult {
  statements: Statement[];
  warnings: string[];
}

export const LR_MAP: Record<Grade, number> = {
  'very-strong+': 10, 'strong+': 5, 'moderate+': 3, 'weak+': 1.5,
  'neutral': 1, 'weak-': 1/1.5, 'moderate-': 1/3, 'strong-': 1/5, 'very-strong-': 1/10
};

export function logit(p: number): number {
  return Math.log(p/(1-p));
}
export function invlogit(lo: number): number {
  return 1/(1+Math.exp(-lo));
}

const ROLE_RE = /^(H\d*|E\+|E-|R|C|D|T|M)\s*:\s*(.*)$/i;

export function parseEWML(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const out: Statement[] = [];
  const warnings: string[] = [];
  let hCounter = 0;

  for (let i=0;i<lines.length;i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(ROLE_RE);
    if (!m) {
      warnings.push(`[L${i+1}] 역할 토큰이 아님: '${line.slice(0,50)}'`);
      continue;
    }
    let label = m[1];
    let role: Role = (label.startsWith('H') && label !== 'H') ? 'H' : (label as Role);
    const rest = m[2];

    // Split text and meta by last '@' occurrence (meta begins with '@')
    let content = rest;
    let meta: Record<string, any> = {};
    const atPos = rest.indexOf('@');
    if (atPos >= 0) {
      content = rest.slice(0, atPos).trim();
      const metaStr = rest.slice(atPos+1).trim();
      meta = parseMeta(metaStr, warnings, i+1);
    } else {
      content = rest.trim();
    }

    // Normalize @ref to array (split by , or ;)
    if (typeof meta['ref'] === 'string') {
      const s = meta['ref'] as string;
      meta['ref'] = s.split(/[;,]/).map(x=>x.trim()).filter(Boolean);
    }

    // grade -> LR
    if ((role === 'E+' || role === 'E-') && meta['LR'] == null && meta['grade']) {
      const g = String(meta['grade']) as Grade;
      if (LR_MAP[g] != null) meta['LR'] = LR_MAP[g];
      else warnings.push(`[L${i+1}] 알 수 없는 grade='${g}'`);
    }

    // p <-> lo sync
    if (meta['p'] != null && meta['lo'] == null) {
      const p = Number(meta['p']);
      if (p <= 0 || p >= 1) warnings.push(`[L${i+1}] p=${p} 범위(0,1) 밖`);
      else meta['lo'] = logit(p);
    } else if (meta['lo'] != null && meta['p'] == null) {
      const lo = Number(meta['lo']);
      meta['p'] = invlogit(lo);
    }

    // Hypothesis label (H1/H2)
    if (role === 'H') {
      if (!label.startsWith('H')) label = `H`;
      if (label === 'H') { hCounter += 1; label = `H${hCounter}`; }
    }

    out.push({
      id: `L${i+1}`,
      role,
      label: (role==='H' ? label : undefined),
      text: content,
      meta,
      line: i+1
    });
  }
  return { statements: out, warnings };
}

function parseMeta(s: string, warnings: string[], lineNo: number): Record<string, any> {
  const meta: Record<string, any> = {};
  // split by comma, but ignore commas inside quotes (simple approach: no quotes allowed -> split by comma/space tolerant)
  const parts = s.split(/\s*,\s*/);
  for (const part of parts) {
    if (!part) continue;
    const kv = part.split('=');
    if (kv.length === 1) {
      meta[kv[0]] = true;
    } else {
      const key = kv[0].trim();
      const val = kv.slice(1).join('=').trim();
      const asNum = Number(val);
      if (!Number.isNaN(asNum) && /^-?\d+(\.\d+)?$/.test(val)) meta[key] = asNum;
      else meta[key] = val;
    }
  }
  return meta;
}
