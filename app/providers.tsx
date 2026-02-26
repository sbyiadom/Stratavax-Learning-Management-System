'use client'

import { createClient } from '@/lib/supabase'
import { SupabaseProvider } from '@supabase/ssr'

export function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  
  return (
    <SupabaseProvider supabaseClient={supabase}>
      {children}
    </SupabaseProvider>
  )
}
