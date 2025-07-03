"use client"

import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Client-side Supabase client for use in components
export const createSupabaseBrowserClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Legacy client for backward compatibility
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
