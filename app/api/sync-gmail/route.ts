import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/lib/google/config'

// Conservative keyword classification — this only ever *suggests* a status;
// the user accepts or dismisses each match in the UI, so a false positive
// here costs a click, not a silently corrupted pipeline.
const REJECT_RE = /unfortunately|decision not to|decided not to|not (?:be )?mov(?:e|ing) forward|not to move forward|other candidates|not selected|not the right fit|not be (?:moving|proceeding|advancing)|will not be (?:moving|proceeding|advancing)|position has been filled|pursue other candidates|not moving ahead|move forward with other candidates/i
const OFFER_RE = /pleased to offer|excited to extend|formal offer|offer letter|extend an offer|thrilled to offer/i
const INTERVIEW_RE = /schedule (?:a|your) (?:call|interview)|next steps|phone screen|move forward with your application|would like to (?:interview|speak)|invite you to interview|advance(?:d|ing)? (?:you|your application) to the next/i

function classify(text: string): 'rejected' | 'offer' | 'interview' | 'update' {
  if (REJECT_RE.test(text)) return 'rejected'
  if (OFFER_RE.test(text)) return 'offer'
  if (INTERVIEW_RE.test(text)) return 'interview'
  return 'update'
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

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
    return NextResponse.json({ scanned: 0, matched: 0 })
  }

  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=' +
      encodeURIComponent('newer_than:45d (application OR interview OR "thank you for applying" OR recruiting OR candidacy OR offer)'),
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
  let matched = 0

  for (const m of messages ?? []) {
    scanned++
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!msgRes.ok) continue
    const msg = await msgRes.json()
    const headers: GmailHeader[] = msg.payload?.headers ?? []
    const from = headers.find((h) => h.name === 'From')?.value ?? ''
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? ''
    const dateHeader = headers.find((h) => h.name === 'Date')?.value
    const snippet: string = msg.snippet ?? ''
    const haystack = normalize(`${from} ${subject} ${snippet}`)

    const match = activeApps.find((a) => {
      const name = normalize(a.company)
      return name.length > 2 && haystack.includes(name)
    })
    if (!match) continue

    const detected_type = classify(`${subject} ${snippet}`)
    const { error } = await supabase.from('gmail_status_signals').upsert(
      {
        user_id: user.id,
        application_id: match.id,
        gmail_message_id: m.id,
        detected_type,
        snippet: snippet.slice(0, 300),
        email_date: dateHeader ? new Date(dateHeader).toISOString() : null,
        status: 'pending',
      },
      { onConflict: 'user_id,gmail_message_id,application_id', ignoreDuplicates: true }
    )
    if (!error) matched++
  }

  await supabase.from('gmail_sync_tokens').update({ last_synced_at: new Date().toISOString() }).eq('user_id', user.id)

  return NextResponse.json({ scanned, matched })
}
