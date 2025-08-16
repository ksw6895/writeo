
  import React from 'react'

  interface Props {
    value: string
    onChange: (v: string) => void
    onLoadDemo: () => void
  }

  export default function EditorPanel({ value, onChange, onLoadDemo }: Props) {
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
    return (
      <div className="panel">
        <header className="row">
          <div>Editor <span className="badge">EWML</span></div>
          <div className="row">
            <a className="btn" href="/" target="_blank" rel="noreferrer">Guide</a>
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
        </div>
      </div>
    )
  }
