import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/lib/google/config'
import { classifyEmailWithAI, type EmailClassification } from '@/lib/anthropic/classify'

// Keyword fallback — used only when ANTHROPIC_API_KEY isn't configured, or
// if the AI call fails. Kept deliberately conservative: this only ever
// *suggests* a status, the user accepts or dismisses each match in the UI,
// so a false positive here costs a click, not a silently corrupted pipeline.
const REJECT_RE = /unfortunately|decision not to|decided not to|not (?:be )?mov(?:e|ing) forward|not to move forward|other candidates|not selected|not the right fit|not be (?:moving|proceeding|advancing)|will not be (?:moving|proceeding|advancing)|position has been filled|pursue other candidates|not moving ahead|move forward with other candidates/i
const OFFER_RE = /pleased to offer|excited to extend|formal offer|offer letter|extend an offer|thrilled to offer/i
const INTERVIEW_RE = /schedule (?:a|your) (?:call|interview)|next steps|phone screen|move forward with your application|would like to (?:interview|speak)|invite you to interview|advance(?:d|ing)? (?:you|your application) to the next/i

function classifyByKeyword(text: string): EmailClassification {
  if (REJECT_RE.test(text)) return 'rejected'
  if (OFFER_RE.test(text)) return 'offer'
  if (INTERVIEW_RE.test(text)) return 'interview'
  return 'update'
}

async function classify(subject: string, snippet: string): Promise<EmailClassification> {
  const aiResult = await classifyEmailWithAI(subject, snippet)
  return aiResult ?? classifyByKeyword(`${subject} ${snippet}`)
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

interface GmailPart {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPart[]
}

/** Gmail's `snippet` field is just a short auto-generated preview (often only
 * the first sentence) — the actual status sentence in a real email is almost
 * always further down, so classification needs the full body, not the preview. */
function extractBody(payload: GmailPart | undefined): string {
  if (!payload) return ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data))
  }
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain')
    if (plain?.body?.data) return decodeBase64Url(plain.body.data)
    const html = payload.parts.find((p) => p.mimeType === 'text/html')
    if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data))
    for (const part of payload.parts) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  return ''
}

const STAGE_ORDER = ['Researching', 'Applied', 'Phone Screen', 'Interview', 'Final Round', 'Offer'] as const

interface GmailHeader { name: string; value: string }

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Gmail sync isn’t configured yet — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment (same OAuth client as Supabase’s Google provider).' },
      { status: 500 }
    )
  }

  const { data: tokenRow } = await supabase
    .from('gmail_sync_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow?.refresh_token) {
    return NextResponse.json(
      { error: 'Gmail isn’t connected yet — sign out and sign back in with Google, and approve Gmail access when prompted.' },
      { status: 400 }
    )
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!tokenRes.ok) {
    const detail = await tokenRes.text()
    return NextResponse.json(
      { error: `Could not refresh Gmail access (Google said: ${detail.slice(0, 300)}) — try signing out and back in to reconnect.` },
      { status: 400 }
    )
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string }

  const { data: apps } = await supabase
    .from('applications')
    .select('id, company, stage')
    .not('stage', 'in', '("Rejected","Withdrawn")')
  const activeApps = apps ?? []
  if (activeApps.length === 0) {
    return NextResponse.json({ scanned: 0, applied: [] })
  }

  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=' +
      encodeURIComponent('newer_than:90d (application OR interview OR "thank you for applying" OR recruiting OR candidacy OR offer)'),
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  if (!listRes.ok) {
    return NextResponse.json(
      { error: 'Gmail API request failed — the connected account may need to reconnect.' },
      { status: 400 }
    )
  }
  const { messages } = (await listRes.json()) as { messages?: { id: string }[] }

  let scanned = 0
  const applied: { company: string; detected_type: EmailClassification; newStage?: string }[] = []

  for (const m of messages ?? []) {
    scanned++
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!msgRes.ok) continue
    const msg = await msgRes.json()
    const headers: GmailHeader[] = msg.payload?.headers ?? []
    const from = headers.find((h) => h.name === 'From')?.value ?? ''
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? ''
    const dateHeader = headers.find((h) => h.name === 'Date')?.value
    const snippet: string = msg.snippet ?? ''
    const bodyText = (extractBody(msg.payload) || snippet).slice(0, 4000)
    const haystack = normalize(`${from} ${subject} ${bodyText}`)

    const match = activeApps.find((a) => {
      const name = normalize(a.company)
      return name.length > 2 && haystack.includes(name)
    })
    if (!match) continue

    const detected_type = await classify(subject, bodyText)

    // Record this email/application pair before applying anything. The unique
    // constraint + ignoreDuplicates means a message we've already processed in
    // a prior sync comes back with no row here — we skip re-applying it, so
    // re-syncing never re-fires an update you may have since corrected by hand.
    const { data: inserted, error } = await supabase
      .from('gmail_status_signals')
      .upsert(
        {
          user_id: user.id,
          application_id: match.id,
          gmail_message_id: m.id,
          detected_type,
          snippet: snippet.slice(0, 300),
          email_date: dateHeader ? new Date(dateHeader).toISOString() : null,
          status: 'applied',
        },
        { onConflict: 'user_id,gmail_message_id,application_id', ignoreDuplicates: true }
      )
      .select('id')

    if (error || !inserted || inserted.length === 0) continue

    const updates: { stage?: string; response?: string } = {}
    if (detected_type === 'rejected') {
      updates.stage = 'Rejected'
      updates.response = 'Rejected (via Gmail, AI-classified)'
    } else if (detected_type === 'offer') {
      updates.stage = 'Offer'
      updates.response = 'Offer received (via Gmail, AI-classified)'
    } else if (detected_type === 'interview') {
      const currentIndex = STAGE_ORDER.indexOf(match.stage as (typeof STAGE_ORDER)[number])
      const phoneScreenIndex = STAGE_ORDER.indexOf('Phone Screen')
      if (currentIndex !== -1 && currentIndex < phoneScreenIndex) updates.stage = 'Phone Screen'
      updates.response = 'Interview requested (via Gmail, AI-classified)'
    } else {
      updates.response = 'Update received (via Gmail, AI-classified) — check email'
    }

    await supabase.from('applications').update(updates).eq('id', match.id)
    applied.push({ company: match.company, detected_type, newStage: updates.stage })
  }

  await supabase.from('gmail_sync_tokens').update({ last_synced_at: new Date().toISOString() }).eq('user_id', user.id)

  return NextResponse.json({ scanned, applied })
}
