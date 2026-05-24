import { NextResponse } from 'next/server'

const PM_KEYWORDS = [
  'roadmap', 'user research', 'A/B testing', 'analytics', 'metrics', 'KPIs',
  'OKRs', 'SQL', 'data-driven', 'product strategy', 'go-to-market', 'GTM',
  'cross-functional', 'stakeholder', 'agile', 'scrum', 'prioritization',
  'wireframe', 'prototype', 'Figma', 'user stories', 'PRD', 'discovery',
  'retention', 'growth', 'monetization', 'API', 'mobile', 'B2B', 'B2C',
  'SaaS', 'enterprise', 'machine learning', 'AI', 'Python', 'Tableau',
  'Looker', 'customer interviews', 'competitive analysis', 'product sense',
  'north star', 'RICE', 'segmentation', 'experimentation', 'product-led',
]

function detectSource(url: string): string {
  if (url.includes('linkedin.com'))    return 'LinkedIn'
  if (url.includes('greenhouse.io'))   return 'Greenhouse'
  if (url.includes('lever.co'))        return 'Lever'
  if (url.includes('workday.com'))     return 'Workday'
  if (url.includes('indeed.com'))      return 'Indeed'
  if (url.includes('wellfound.com') || url.includes('angel.co')) return 'AngelList'
  if (url.includes('workatastartup.com')) return 'YC Jobs'
  return 'Direct'
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return PM_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).slice(0, 15)
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
}

function parseJobTitle(raw: string): { role: string; company: string } {
  // Strip trailing site names
  const cleaned = decodeEntities(raw)
    .replace(/\s*[-|•·]\s*(LinkedIn|Indeed|Glassdoor|Greenhouse|Lever|Workday|Workable|SmartRecruiters|BambooHR|Ashby)\s*$/i, '')
    .trim()

  // "Role at Company"
  const atMatch = cleaned.match(/^(.+?)\s+at\s+(.+)$/i)
  if (atMatch) return { role: atMatch[1].trim(), company: atMatch[2].trim() }

  // "Role - Company" or "Role | Company"
  const sepMatch = cleaned.match(/^(.+?)\s*[-–|]\s*(.+)$/)
  if (sepMatch) return { role: sepMatch[1].trim(), company: sepMatch[2].trim() }

  return { role: cleaned, company: '' }
}

function getMetaContent(html: string, ...attrs: string[]): string {
  for (const attr of attrs) {
    const m = html.match(new RegExp(
      `<meta[^>]+(?:property|name)="${attr}"[^>]+content="([^"]+)"`, 'i'
    )) ?? html.match(new RegExp(
      `<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${attr}"`, 'i'
    ))
    if (m?.[1]) return decodeEntities(m[1])
  }
  return ''
}

function extractFromText(text: string): { role: string; company: string; descriptionText: string } {
  let role = '', company = '', descriptionText = ''

  // Look for "Title: ..." or "Position: ..." patterns common in Jina markdown output
  const titleMatch = text.match(/(?:^|\n)(?:Title|Position|Job Title|Role)[:\s]+([^\n]+)/i)
  if (titleMatch) {
    const parsed = parseJobTitle(titleMatch[1].trim())
    role = parsed.role
    company = parsed.company
  }

  // Look for "Company: ..." or "Organization: ..." patterns
  if (!company) {
    const compMatch = text.match(/(?:^|\n)(?:Company|Organization|Employer|Hiring Company)[:\s]+([^\n]+)/i)
    if (compMatch) company = compMatch[1].trim()
  }

  // First H1-style heading in markdown (# heading)
  if (!role) {
    const h1Match = text.match(/^#\s+([^\n]+)/m)
    if (h1Match) {
      const parsed = parseJobTitle(h1Match[1].trim())
      role = parsed.role
      if (!company) company = parsed.company
    }
  }

  // First bold line (**...**) as fallback title
  if (!role) {
    const boldMatch = text.match(/\*\*([^*\n]{5,80})\*\*/)
    if (boldMatch) {
      const parsed = parseJobTitle(boldMatch[1].trim())
      role = parsed.role
      if (!company) company = parsed.company
    }
  }

  // Use a portion of the text as description
  descriptionText = text.replace(/\s+/g, ' ').trim().slice(0, 600)

  return { role, company, descriptionText }
}

async function tryJinaFetch(url: string): Promise<{ role: string; company: string; keywords: string[]; notes: string } | null> {
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text',
        'X-Timeout': '15',
      },
      signal: AbortSignal.timeout(18000),
    })
    if (!jinaRes.ok) return null
    const text = await jinaRes.text()
    if (!text || text.length < 100) return null

    const { role, company, descriptionText } = extractFromText(text)
    const keywords = extractKeywords(text)

    if (!role && !company) return null

    return {
      role: role.trim(),
      company: company.trim(),
      keywords,
      notes: descriptionText.slice(0, 500),
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const url: string = body.url ?? ''
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    })

    const html = await res.text()

    // ── 0. Bot / security check detection ────────────────────────────────────
    const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.toLowerCase() ?? ''
    const botSignals = ['security check', 'captcha', 'access denied', 'robot', 'blocked', 'just a moment', 'verify you are human', 'attention required', 'ddos-guard', 'please enable js']
    const isBotBlocked = botSignals.some(s => pageTitle.includes(s))

    if (isBotBlocked) {
      // ── 0a. Try Jina AI as bypass ──────────────────────────────────────────
      const jina = await tryJinaFetch(url)
      if (jina && (jina.role || jina.company)) {
        return NextResponse.json({
          company: jina.company,
          role: jina.role,
          url,
          source: detectSource(url),
          keywords: jina.keywords,
          notes: jina.notes,
        })
      }
      // Jina also failed — return partial with warning
      return NextResponse.json({
        error: `This site blocked the import. The URL and source are pre-filled — please fill in the title and company manually.`,
        company: '',
        role: '',
        url,
        source: detectSource(url),
        keywords: [],
        notes: '',
      })
    }

    let role = '', company = '', descriptionText = ''

    // ── 1. JSON-LD JobPosting schema (most reliable) ──────────────────────────
    const scriptBlocks = Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))
    for (const [, content] of scriptBlocks) {
      try {
        const parsed = JSON.parse(content.trim())
        const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed]
        const job = items.find((d: unknown) => (d as Record<string, unknown>)?.['@type'] === 'JobPosting') as Record<string, unknown> | undefined
        if (job) {
          role = String(job.title ?? '')
          const org = job.hiringOrganization as Record<string, unknown> | string | undefined
          company = typeof org === 'string' ? org : String(org?.name ?? '')
          descriptionText = String(job.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          break
        }
      } catch { /* non-JSON block */ }
    }

    // ── 2. OpenGraph tags ─────────────────────────────────────────────────────
    if (!role) {
      const ogTitle = getMetaContent(html, 'og:title')
      if (ogTitle) {
        const parsed = parseJobTitle(ogTitle)
        role = parsed.role
        if (!company) company = parsed.company
      }
    }
    if (!company) {
      company = getMetaContent(html, 'og:site_name')
    }

    // ── 3. Page <title> fallback ──────────────────────────────────────────────
    if (!role) {
      const rawTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ''
      const parsed = parseJobTitle(rawTitle)
      role = parsed.role
      if (!company) company = parsed.company
    }

    // ── 4. Description from meta ──────────────────────────────────────────────
    if (!descriptionText) {
      descriptionText = getMetaContent(html, 'description', 'og:description').slice(0, 600)
    }

    // ── 5. Keyword extraction from full page text ─────────────────────────────
    const fullText = html.replace(/<[^>]+>/g, ' ')
    const keywords = extractKeywords(fullText + ' ' + descriptionText)

    return NextResponse.json({
      company: company.trim(),
      role: role.trim(),
      url,
      source: detectSource(url),
      keywords,
      notes: descriptionText.slice(0, 500),
    })
  } catch {
    // Direct fetch failed entirely — try Jina AI before giving up
    const jina = await tryJinaFetch(url)
    if (jina && (jina.role || jina.company)) {
      return NextResponse.json({
        company: jina.company,
        role: jina.role,
        url,
        source: detectSource(url),
        keywords: jina.keywords,
        notes: jina.notes,
      })
    }
    return NextResponse.json({
      error: 'Could not fetch this page. The URL and source are pre-filled — fill in the rest manually.',
      company: '',
      role: '',
      url,
      source: detectSource(url),
      keywords: [],
      notes: '',
    })
  }
}
