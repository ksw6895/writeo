
import React, { useEffect, useRef } from 'react'
import cytoscape, { ElementDefinition } from 'cytoscape'
import type { ParseResult } from '../ewml/parser'
import type { ComputeResult } from '../ewml/engine'

interface Props {
  parsed: ParseResult
  computed: ComputeResult
}

export default function GraphPanel({ parsed, computed }: Props) {
  const ref = useRef<HTMLDivElement|null>(null)
  const cyRef = useRef<cytoscape.Core|null>(null)

  useEffect(()=>{
    if (!ref.current) return
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: ref.current,
        style: [
          { selector: 'node', style: { 'background-color': '#7aa2ff', 'label': 'data(label)', 'color':'#e6eaf0', 'font-size':'10px', 'text-wrap':'wrap', 'text-max-width':'120px' } },
          { selector: 'node.h', style: { 'background-color': '#394bff' } },
          { selector: 'node.eplus', style: { 'background-color': '#34c38f' } },
          { selector: 'node.eminus', style: { 'background-color': '#f46a6a' } },
          { selector: 'edge', style: { 'width': 1.5, 'line-color': '#6b7280', 'target-arrow-color': '#6b7280', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } }
        ],
        layout: { name: 'breadthfirst', directed: true, spacingFactor: 1.2, padding: 10 }
      })
    }
    const cy = cyRef.current!
    const elements: ElementDefinition[] = []

    // Build H nodes
    const hIndex = new Map(computed.hResults.map(h=>[h.hid, h]))
    for (const h of parsed.statements.filter(s=>s.role==='H')) {
      const res = h.label ? hIndex.get(h.label) : undefined
      const prior = res?.prior.p!=null ? res?.prior.p.toFixed(3) : '—'
      const post  = res?.posterior.p!=null ? res?.posterior.p.toFixed(3) : '—'
      elements.push({ data: { id: h.label || h.id, label: `${h.label||'H?'}\n${h.text}\n${prior}→${post}` }, classes: 'h' })
    }

    // Evidence nodes and edges
    for (const e of parsed.statements.filter(s=>s.role==='E+'||s.role==='E-')) {
      const id = e.id
      const label = `${e.role} ${e.meta.LR ? `LR=${e.meta.LR}` : (e.meta.grade?`grade=${e.meta.grade}`:'')}`
      const cls = e.role==='E+' ? 'eplus' : 'eminus'
      elements.push({ data: { id, label: label || e.role }, classes: cls })
      const refs: string[] = Array.isArray(e.meta.ref) ? e.meta.ref : []
      for (const r of refs) {
        elements.push({ data: { id: `${id}->${r}`, source: id, target: r } })
      }
    }

    cy.elements().remove()
    cy.add(elements)
    cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.2, padding: 10 }).run()

  }, [parsed, computed])

  return (
    <div className="panel">
      <header>Graph</header>
      <div className="content" style={{padding:0}}>
        <div ref={ref} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>
  )
}
