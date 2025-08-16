
  import React, { useState } from 'react'

  interface Props {
    value: string
    onChange: (v: string) => void
    onLoadDemo: () => void
  }

  export default function EditorPanel({ value, onChange, onLoadDemo }: Props) {
    const [aiBusy, setAiBusy] = useState(false)
    function normalizeRoles(v: string): string {
      // Normalize role tokens at start of lines: h/h1/e+/e-/r/c/d/t/m -> uppercase
      return v.replace(/^(h\d*|e\+|e-|r|c|d|t|m)(\s*:\s*)/gim, (_m, role: string, sep: string) => {
        let out = role
        if (role[0].toLowerCase() === 'h') out = 'H' + role.slice(1)
        else out = role.toUpperCase()
        return out + sep
      })
    }

    function handleChange(next: string) {
      const normalized = normalizeRoles(next)
      onChange(normalized)
    }

    async function callAI(mode: 'translate'|'enrich') {
      if (aiBusy) return
      setAiBusy(true)
      try {
        const res = await fetch('/api/ewml-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, input: value, options: { language: 'ko', includePriors: mode === 'translate' } })
        })
        if (!res.ok) {
          const text = await res.text()
          alert(`AI 오류: ${res.status}\n${text}`)
          return
        }
        const data = await res.json()
        if (typeof data.output === 'string' && data.output.trim()) {
          onChange(data.output)
        } else {
          alert('AI 응답이 비어 있습니다.')
        }
      } catch (e: any) {
        alert('AI 호출 실패: ' + (e?.message || e))
      } finally {
        setAiBusy(false)
      }
    }
    return (
      <div className="panel">
        <header className="row">
          <div>Editor <span className="badge">EWML</span></div>
          <div className="row">
            <a className="btn" href="/" target="_blank" rel="noreferrer">Guide</a>
            <button className="btn" disabled={aiBusy || !value.trim()} onClick={()=>callAI('translate')}>{aiBusy ? 'AI…' : 'AI 변환'}</button>
            <button className="btn" disabled={aiBusy || !value.trim()} onClick={()=>callAI('enrich')}>{aiBusy ? 'AI…' : 'AI 보강'}</button>
            <button className="btn" onClick={()=>onLoadDemo()}>샘플 불러오기</button>
            <button className="btn" onClick={()=>navigator.clipboard.writeText(value)}>복사</button>
          </div>
        </header>
        <div className="content">
          <textarea
            className="editor"
            spellCheck={false}
            value={value}
            onChange={e=>handleChange(e.target.value)}
            placeholder="예) H: 가설 @p=0.2
E+: 근거 한 줄 @ref=H1, @grade=moderate+
E-: 반증 한 줄 @ref=H1, @LR=0.33
D: if p(H1) ≥ 0.6 => 행동 X"
          />
          <div className="small muted" style={{marginTop:8}}>
            힌트: 왼쪽 에디터에 직접 EWML을 쓰거나, 오른쪽 상단의 <strong>AI Assist</strong> 패널에서 자유 서술을 변환해 적용하세요.
          </div>
        </div>
      </div>
    )
  }
