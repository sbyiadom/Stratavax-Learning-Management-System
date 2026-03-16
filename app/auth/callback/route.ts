import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user after successful authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // IMPORTANT: Using 'profiles' table (NOT user_profiles)
        const { data: existingProfile } = await supabase
          .from('profiles')  // ← CORRECT table name
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        // If no profile exists, create one
        if (!existingProfile) {
          // Parse name from user metadata
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
          const nameParts = fullName.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          // IMPORTANT: Insert into 'profiles' table with ALL required fields
          await supabase
            .from('profiles')  // ← CORRECT table name
            .insert({
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              avatar_url: user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
        }
      }
    }
    
    return response
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
