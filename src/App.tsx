
import React, { useEffect, useMemo, useState } from 'react'
import EditorPanel from './components/EditorPanel'
import OutlinePanel from './components/OutlinePanel'
import GraphPanel from './components/GraphPanel'
import ConsolePanel from './components/ConsolePanel'
import LearnPanel from './components/LearnPanel'
import { parseEWML } from './ewml/parser'
import { compute } from './ewml/engine'

const LS_KEY = 'ewml-pad-document'

export default function App() {
  const [doc, setDoc] = useState<string>(()=>localStorage.getItem(LS_KEY) || '')

  useEffect(()=>{
    const id = setTimeout(()=>localStorage.setItem(LS_KEY, doc), 300)
    return ()=>clearTimeout(id)
  }, [doc])

  const parsed = useMemo(()=>parseEWML(doc), [doc])
  const computed = useMemo(()=>compute(parsed), [parsed])

  async function loadDemo() {
    const txt = await fetch('/demo.ewml').then(r=>r.text())
    setDoc(txt)
  }

  return (
    <div className="app">
      <EditorPanel value={doc} onChange={setDoc} onLoadDemo={loadDemo} />
      <OutlinePanel parsed={parsed} computed={computed} />
      <GraphPanel parsed={parsed} computed={computed} />
      <ConsolePanel lints={computed.lints} />
      {/* Learn replaces Outline bottom-right if desired; for now 2x2 grid -> add Learn below via swap if needed */}
      <div style={{ display:'none' }}><LearnPanel parsed={parsed} computed={computed} /></div>
    </div>
  )
}
