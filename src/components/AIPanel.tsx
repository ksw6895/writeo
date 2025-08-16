import React, { useMemo, useState } from 'react'

interface Props {
  editorValue: string
  setEditorValue: (v: string) => void
}

type Mode = 'translate'|'enrich'

export default function AIPanel({ editorValue, setEditorValue }: Props) {
  const [mode, setMode] = useState<Mode>('translate')
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<string>('')
  const [includePriors, setIncludePriors] = useState<boolean>(true)
  const [model, setModel] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)
  const [logs, setLogs] = useState<string[]>([])

  const canRun = useMemo(()=>{
    if (mode === 'translate') return input.trim().length > 0
    return (input.trim().length > 0) || (editorValue.trim().length > 0)
  }, [mode, input, editorValue])

  async function run() {
    if (!canRun || busy) return
    setBusy(true)
    setOutput('')
    const payload = {
      mode,
      input: input.trim() ? input : editorValue,
      options: { language: 'ko' as const, includePriors, model: model.trim() || undefined }
    }
    const started = Date.now()
    try {
      const res = await fetch('/api/ewml-assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const txt = await res.text()
      if (!res.ok) {
        setOutput('')
        addLog(`❌ ${mode} 실패 (${res.status})`)
        alert(`AI 오류 ${res.status}:\n${txt}`)
        return
      }
      const data = JSON.parse(txt)
      const out = String(data.output || '').trim()
      setOutput(out)
      const ms = Date.now() - started
      addLog(`✅ ${mode} 완료 ${out.length}자 · ${ms}ms`)
    } catch (e: any) {
      addLog(`❌ 네트워크 오류`)
      alert('AI 호출 실패: ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  function addLog(line: string) {
    setLogs(prev => [line, ...prev].slice(0, 5))
  }

  function applyReplace() {
    if (!output.trim()) return
    setEditorValue(output)
  }
  function applyAppend() {
    if (!output.trim()) return
    const sep = editorValue.trim().length ? '\n' : ''
    setEditorValue(editorValue + sep + output)
  }

  async function copyOut() {
    if (!output.trim()) return
    await navigator.clipboard.writeText(output)
    addLog('📋 복사됨')
  }

  return (
    <div className="panel ai-panel">
      <header className="row">
        <div>AI Assist <span className="badge">LLM</span></div>
        <div className="row" style={{gap:6}}>
          <select value={mode} onChange={e=>setMode(e.target.value as Mode)} className="select">
            <option value="translate">자유글→EWML 변환</option>
            <option value="enrich">EWML 보강</option>
          </select>
          <label className="toggle small"><input type="checkbox" checked={includePriors} onChange={e=>setIncludePriors(e.target.checked)} /> prior 제안</label>
        </div>
      </header>
      <div className="content" style={{display:'grid', gap:8, gridTemplateRows:'auto 1fr auto auto'}}>
        <div className="small muted">입력: 자유 서술을 붙여넣거나 빈 칸이면 현재 에디터 내용을 사용합니다.</div>
        <textarea className="editor ai-input" placeholder={mode==='translate' ? '여기에 자유 서술을 붙여넣으세요. (비워두면 에디터 내용 사용)' : '보강 대상 EWML(비워두면 에디터 내용 사용)'} value={input} onChange={e=>setInput(e.target.value)} />
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="row" style={{gap:6}}>
            <input className="input" placeholder="모델(선택, 예: gemini-2.5-flash)" value={model} onChange={e=>setModel(e.target.value)} />
            <button className="btn" disabled={!canRun || busy} onClick={run}>{busy ? '생성 중…' : '실행'}</button>
          </div>
          <div className="row small muted" style={{gap:12}}>
            {busy && <span className="spinner" aria-label="loading" />}
            <span>로그: {logs[0] || '—'}</span>
          </div>
        </div>
        <div>
          <div className="small muted" style={{marginBottom:6}}>미리보기</div>
          <pre className="code" style={{minHeight:80, maxHeight:180}}>{output || '—'}</pre>
          <div className="row" style={{justifyContent:'flex-end', gap:6, marginTop:6}}>
            <button className="btn" disabled={!output.trim()} onClick={copyOut}>복사</button>
            <button className="btn" disabled={!output.trim()} onClick={applyAppend}>에디터에 추가</button>
            <button className="btn" disabled={!output.trim()} onClick={applyReplace}>에디터 대체</button>
          </div>
        </div>
        {logs.length>0 && (
          <div className="small muted">{logs.map((l,i)=>(<div key={i}>{l}</div>))}</div>
        )}
      </div>
    </div>
  )
}

