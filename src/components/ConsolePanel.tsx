
import React from 'react'
import type { ComputeResult } from '../ewml/engine'

interface Props {
  lints: string[]
}

export default function ConsolePanel({ lints }: Props) {
  return (
    <div className="panel">
      <header>Console</header>
      <div className="content">
        {lints.length===0 ? (
          <div className="muted">문제 없음.</div>
        ) : (
          <ul>
            {lints.map((w, i)=>(<li key={i} className={w.includes('오류')||w.includes('LR<=0')?'lint-err':'lint-warn'}>{w}</li>))}
          </ul>
        )}
        <div className="small muted" style={{marginTop:10}}>
          린트 예: @ref 누락, LR 범위, prior 없음, p/lo 불일치 등
        </div>
      </div>
    </div>
  )
}
