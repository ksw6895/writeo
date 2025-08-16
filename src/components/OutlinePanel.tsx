
import React from 'react'
import type { ParseResult } from '../ewml/parser'
import type { ComputeResult } from '../ewml/engine'

interface Props {
  parsed: ParseResult
  computed: ComputeResult
}

export default function OutlinePanel({ parsed, computed }: Props) {
  const Hs = parsed.statements.filter(s=>s.role==='H')
  const Ds = parsed.statements.filter(s=>s.role==='D')
  const Ts = parsed.statements.filter(s=>s.role==='T')

  const hIndex = new Map(computed.hResults.map(h=>[h.hid, h]))

  return (
    <div className="panel">
      <header>Outline</header>
      <div className="content">
        <div className="list">
          <div className="muted small">H / D / T 요약</div>
          {Hs.map(h=>{
            const res = h.label ? hIndex.get(h.label) : undefined
            const prior = res?.prior.p ?? undefined
            const post = res?.posterior.p ?? undefined
            return (
              <div key={h.id} className="outline-item">
                <div><strong>{h.label ?? 'H?'}</strong> — {h.text}</div>
                <div className="small muted">
                  prior {prior!=null ? prior.toFixed(3): '—'} → posterior <strong>{post!=null ? post.toFixed(3): '—'}</strong> | Σ ln(LR): {(res?.sumLnLR ?? 0).toFixed(3)}
                </div>
              </div>
            )
          })}
          {Ds.length>0 && <div className="muted small" style={{marginTop:8}}>Decisions</div>}
          {Ds.map(d=>(
            <div key={d.id} className="outline-item">
              <div><strong>D</strong> — {d.text}</div>
            </div>
          ))}
          {Ts.length>0 && <div className="muted small" style={{marginTop:8}}>Tasks</div>}
          {Ts.map(t=>(
            <div key={t.id} className="outline-item">
              <div><strong>T</strong> — {t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
