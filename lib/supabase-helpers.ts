import { createClient } from './supabase-server'
import { Database } from './database.types'

// Type helpers
export type Tables = Database['public']['Tables']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Safe insert helper - bypasses TypeScript strict checking
export async function safeInsert<T extends keyof Tables>(
  table: T,
  data: TableInsert<T>
) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .insert(data as any)
}

// Safe update helper
export async function safeUpdate<T extends keyof Tables>(
  table: T,
  data: TableUpdate<T>,
  matchField: string,
  matchValue: string
) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .update(data as any)
    .eq(matchField, matchValue)
}

// Safe upsert helper
export async function safeUpsert<T extends keyof Tables>(
  table: T,
  data: TableInsert<T>,
  onConflict: string
) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .upsert(data as any, { onConflict } as any)
}

// Safe select helper with proper typing
export async function safeSelect<T extends keyof Tables>(
  table: T,
  columns: string = '*',
  conditions?: Record<string, any>
) {
  const supabase = await createClient()
  let query = supabase.from(table).select(columns)
  
  if (conditions) {
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  
  return await query as any
}
