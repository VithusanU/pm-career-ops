// Strip the UTF-8 BOM (﻿) that PowerShell injects when piping env var values to Vercel CLI
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^﻿/, '')
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').replace(/^﻿/, '')
