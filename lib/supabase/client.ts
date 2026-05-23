'use client'
import { createBrowserClient } from '@supabase/ssr'

function tryDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return document.cookie
            .split('; ')
            .filter(Boolean)
            .map(pair => {
              const idx = pair.indexOf('=')
              if (idx < 0) return { name: pair, value: '' }
              return {
                name: pair.slice(0, idx),
                value: tryDecode(pair.slice(idx + 1)),
              }
            })
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            const parts = [`${name}=${encodeURIComponent(value)}`]
            if (options?.path) parts.push(`path=${String(options.path)}`)
            if (options?.maxAge) parts.push(`max-age=${Number(options.maxAge)}`)
            if (options?.domain) parts.push(`domain=${String(options.domain)}`)
            if (options?.sameSite) parts.push(`samesite=${String(options.sameSite)}`)
            if (options?.secure) parts.push('secure')
            document.cookie = parts.join('; ')
          })
        },
      },
    }
  )
}
