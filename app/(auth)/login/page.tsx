'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/app/providers'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import Link from 'next/link'

export default function LoginPage() {
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const [error, setError] = useState<string | null>(searchParams.get('error'))

  useEffect(() => {
    if (session) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to StrataVax
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
              style: {
                button: {
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  padding: '0.625rem 1rem',
                },
                input: {
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  padding: '0.625rem 1rem',
                },
              },
            }}
            theme="light"
            providers={['github', 'google']}
            providerScopes={{
              github: 'read:user user:email',
              google: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            }}
            redirectTo={`${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`}
            onlyThirdPartyProviders={false}
            view="sign_in"
          />
        </div>
      </div>
    </div>
  )
}
