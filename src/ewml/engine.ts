
import { Statement, ParseResult, invlogit, logit } from './parser'

export interface HResult {
  hid: string;                // e.g., 'H1'
  lineId: string;             // statement id
  prior: { p?: number; lo?: number };
  sumLnLR: number;
  posterior: { p: number; lo: number };
  evidence: { sid: string; kind: 'E+'|'E-'; lnLR: number; kappa: number; text: string }[];
  warnings: string[];
}

export interface ComputeResult {
  hResults: HResult[];
  lints: string[];
}

export function compute(parsed: ParseResult): ComputeResult {
  const lints: string[] = [...parsed.warnings];
  const statements = parsed.statements;

  // Collect hypotheses
  const Hs = statements.filter(s => s.role === 'H');
  const E = statements.filter(s => s.role === 'E+' || s.role === 'E-');
  const results: HResult[] = [];

  // Build lookup for H by label 'H1'
  const HbyLabel = new Map<string, Statement>();
  for (const h of Hs) {
    if (h.label) HbyLabel.set(h.label, h);
  }

  // Compute for each H
  for (const h of Hs) {
    const hid = h.label ?? 'H?';
    let lo = (typeof h.meta.lo === 'number') ? h.meta.lo : undefined;
    if (lo == null && typeof h.meta.p === 'number') lo = Math.log(h.meta.p/(1-h.meta.p));
    if (lo == null) {
      lints.push(`[${h.id}] ${hid}: prior(@p 또는 @lo)이 없습니다. 기본 0(logit 0.5)을 사용.`);
      lo = 0;
    }
    const priorP = 1/(1+Math.exp(-lo));

    const evList: HResult['evidence'] = [];
    let sumLnLR = 0;

    for (const e of E) {
      const refs: string[] = Array.isArray(e.meta.ref) ? e.meta.ref : [];
      if (!refs.length) {
        lints.push(`[${e.id}] E±에 @ref가 없습니다.`);
        continue;
      }
      if (!refs.includes(hid)) continue;

      let LR = (typeof e.meta.LR === 'number') ? e.meta.LR : undefined;
      if (LR == null) {
        lints.push(`[${e.id}] ${hid}를 참조하지만 LR/grade가 없어 업데이트에서 제외됩니다.`);
        continue;
      }
      if (!(LR > 0)) {
        lints.push(`[${e.id}] LR 값이 0 이하입니다.`);
        continue;
      }
      const kappa = (typeof e.meta.kappa === 'number') ? e.meta.kappa : 1.0;
      const lnLR = Math.log(LR) * kappa;

      evList.push({ sid: e.id, kind: e.role as 'E+'|'E-', lnLR, kappa, text: e.text });
      sumLnLR += lnLR;
    }

    const loPost = lo + sumLnLR;
    const pPost = 1/(1+Math.exp(-loPost));

    results.push({
      hid, lineId: h.id,
      prior: { p: priorP, lo },
      sumLnLR,
      posterior: { p: pPost, lo: loPost },
      evidence: evList,
      warnings: []
    });
  }

  // Cycle check (simple): if an H references itself via => in R/D text (not implemented) – skipped in MVP

  // Lint: E- with LR >= 1, E+ with LR <= 1
  for (const e of E) {
    if (typeof e.meta.LR === 'number') {
      if (e.role === 'E-' && e.meta.LR >= 1) {
        lints.push(`[${e.id}] E-인데 LR>=1 (약화 근거는 LR<1 권장).`);
      }
      if (e.role === 'E+' && e.meta.LR <= 1) {
        lints.push(`[${e.id}] E+인데 LR<=1 (지지 근거는 LR>1 권장).`);
      }
    }
  }

  return { hResults: results, lints };
}
