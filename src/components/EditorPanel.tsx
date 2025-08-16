
  import React from 'react'

  interface Props {
    value: string
    onChange: (v: string) => void
    onLoadDemo: () => void
  }

  export default function EditorPanel({ value, onChange, onLoadDemo }: Props) {
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
            onChange={e=>onChange(e.target.value)}
            placeholder="예) H: 가설 @p=0.2
E+: 근거 한 줄 @ref=H1, @grade=moderate+
E-: 반증 한 줄 @ref=H1, @LR=0.33
D: if p(H1) ≥ 0.6 => 행동 X"
          />
        </div>
      </div>
    )
  }
