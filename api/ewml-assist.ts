export const config = { runtime: 'edge' } as const

type Mode = 'translate' | 'enrich'

interface RequestBody {
  mode: Mode
  input: string
  options?: {
    language?: 'ko' | 'en'
    includePriors?: boolean
    model?: string
  }
}

function buildPrompt(body: RequestBody): string {
  const { mode, input, options } = body
  const lang = options?.language || 'ko'
  const includePriors = options?.includePriors ?? true
  const guide = `You are an assistant that rewrites content into EWML (External Working Memory Language).\n\nEWML quick spec:\n- Roles (one line each): H (Hypothesis), E+ (Evidence for), E- (Evidence against), R (Rationale), C (Comment), D (Decision), T (Task), M (Meta).\n- Line form: ROLE: text @meta1=value1, @meta2=value2\n- Meta keys: @p (0..1), @lo (logit), @LR (>0), @grade (very-strong+/strong+/moderate+/weak+/neutral/weak-/moderate-/strong-/very-strong-), @ref=H1,H2, @kappa (0..1), @src, @time\n- Grades map to LR: very-strong+ 10 | strong+ 5 | moderate+ 3 | weak+ 1.5 | neutral 1 | weak- 1/1.5 | moderate- 1/3 | strong- 1/5 | very-strong- 1/10\n- Update rule (info): lo_post = lo_prior + sum(kappa * ln(LR)) ; p = 1/(1+e^-lo)\n- Conventions: E+ usually LR>1, E- usually LR<1. Every E± should carry @ref to target H.\n\nInstructions:\n- Output only valid EWML lines. No commentary, no code fences.\n- Keep lines atomic.\n- Prefer @grade over raw @LR when uncertain.\n- ${includePriors ? 'Propose @p (or @lo) for each H if reasonably inferable.' : 'If @p is not obvious, omit and leave it to the user.'}\n- Use @ref to link each E± to the appropriate Hn.\n- Preserve source hints as @src or @time when possible.\n- Language for text should be ${lang === 'ko' ? 'Korean' : 'English'}.`

  const task = mode === 'translate'
    ? (lang === 'ko'
        ? '다음 입력을 읽고, 핵심 가설(H), 찬반 근거(E±), 필요한 결정/작업(D/T)을 EWML로 변환하세요.'
        : 'Read the input and convert it into EWML with core Hypotheses (H), supporting/opposing Evidence (E±), and any Decisions/Tasks (D/T).')
    : (lang === 'ko'
        ? '다음 EWML을 점검하고, 누락된 메타(@ref, @grade/@LR, @kappa, 필요 시 @p)를 보강한 EWML을 출력하세요. 원문의 의도를 바꾸지 마세요.'
        : 'Inspect the following EWML and enrich missing meta (@ref, @grade/@LR, @kappa, and @p when appropriate) without changing intent.')

  return `${guide}\n\n${task}\n\nINPUT:\n${input}`
}

function extractTextFromGemini(json: any): string | null {
  try {
    const cands = json.candidates
    if (Array.isArray(cands) && cands.length > 0) {
      const parts = cands[0]?.content?.parts
      if (Array.isArray(parts) && parts.length > 0) {
        const txt = parts.map((p: any) => p?.text ?? '').join('')
        return (txt || '').trim()
      }
    }
  } catch {}
  return null
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }
  let body: RequestBody
  try {
    body = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  const model = body.options?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com'
  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta' // allow 'v1' or 'v1beta' or 'auto'
  const buildEndpoint = (version: string) => `${apiBase}/${version}/models/${model}:generateContent?key=${apiKey}`

  const prompt = buildPrompt(body)
  const payload = {
    contents: [ { role: 'user', parts: [ { text: prompt } ] } ],
    generationConfig: { temperature: 0.2, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
  }

  try {
    const primaryVersion = apiVersion === 'auto' ? 'v1' : apiVersion
    const primaryUrl = buildEndpoint(primaryVersion)
    let r = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    // Fallback to v1beta if auto/v1 fails
    if (!r.ok && apiVersion === 'auto') {
      const fallbackUrl = buildEndpoint('v1beta')
      r = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    if (!r.ok) {
      const errText = await r.text()
      return new Response(JSON.stringify({ error: 'Upstream error', status: r.status, details: errText, tried: primaryUrl }), { status: 502, headers: { 'Content-Type': 'application/json' } })
    }
    const data = await r.json()
    const output = extractTextFromGemini(data) || ''
    // Ensure we only return EWML-like lines (strip code fences if any)
    const cleaned = output.replace(/```[\s\S]*?```/g, '').trim()
    return new Response(JSON.stringify({ output: cleaned }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Fetch failed', details: String(e?.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
