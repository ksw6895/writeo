
import React, { useEffect, useState } from 'react'
import type { ParseResult } from '../ewml/parser'
import type { ComputeResult } from '../ewml/engine'

interface LessonStep {
  id: string
  desc: string
  check: 'hasHWithPrior'|'hasEPlusWithRef'|'posteriorAbove'
  threshold?: number
}
interface Lesson {
  id: string
  title: string
  steps: LessonStep[]
}

interface Props {
  parsed: ParseResult
  computed: ComputeResult
}

export default function LearnPanel({ parsed, computed }: Props) {
  const [lesson, setLesson] = useState<Lesson|null>(null)

  useEffect(()=>{
    fetch('/lessons/lesson1.json').then(r=>r.json()).then(setLesson).catch(()=>{})
  }, [])

  function checkStep(s: LessonStep): boolean {
    switch (s.check) {
      case 'hasHWithPrior': {
        return parsed.statements.some(st => st.role==='H' && (typeof st.meta.p==='number' || typeof st.meta.lo==='number'))
      }
      case 'hasEPlusWithRef': {
        return parsed.statements.some(st => st.role==='E+' && Array.isArray(st.meta.ref) && st.meta.ref.length>0 && (typeof st.meta.LR==='number' || st.meta.grade))
      }
      case 'posteriorAbove': {
        const thr = s.threshold ?? 0.6
        return computed.hResults.some(h => h.posterior.p >= thr)
      }
    }
  }

  if (!lesson) {
    return (
      <div className="panel">
        <header>Learn</header>
        <div className="content"><div className="muted">레슨 로딩 중…</div></div>
      </div>
    )
  }

  return (
    <div className="panel">
      <header>Learn <span className="badge">{lesson.title}</span></header>
      <div className="content">
        {lesson.steps.map(step=>{
          const ok = checkStep(step)
          return (
            <div key={step.id} className={`lesson-step ${ok?'done':''}`}>
              <div>{ok ? '✅' : '⬜️'} {step.desc}</div>
            </div>
          )
        })}
        <div className="small muted">필요 시 Editor에서 샘플을 불러와 실습하세요.</div>
      </div>
    </div>
  )
}
