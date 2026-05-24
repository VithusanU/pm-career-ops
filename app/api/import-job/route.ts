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
      const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ''
      const parsed = parseJobTitle(pageTitle)
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
    // Return partial data with detected source so user can fill the rest
    return NextResponse.json({
      error: 'Could not fetch — the site may block automated requests. Fields you can fill manually.',
      company: '',
      role: '',
      url,
      source: detectSource(url),
      keywords: [],
      notes: '',
    })
  }
}
