import { createClient } from './supabase-server'

// Generic function for inserts that bypasses TypeScript strict checking
export async function insertData(table: string, data: any) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .insert(data)
}

// Generic function for updates
export async function updateData(table: string, data: any, matchField: string, matchValue: string) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .update(data)
    .eq(matchField, matchValue)
}

// Generic function for selects
export async function selectData(table: string, matchField: string, matchValue: string) {
  const supabase = await createClient()
  return await supabase
    .from(table)
    .select('*')
    .eq(matchField, matchValue)
    .single()
}

// Generic function for select with multiple conditions
export async function selectDataWithConditions(table: string, conditions: Record<string, any>) {
  const supabase = await createClient()
  let query = supabase.from(table).select('*')
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  return await query
}

// Generic function for checking existence
export async function checkExists(table: string, conditions: Record<string, any>) {
  const supabase = await createClient()
  let query = supabase.from(table).select('id')
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  return await query.maybeSingle()
}
