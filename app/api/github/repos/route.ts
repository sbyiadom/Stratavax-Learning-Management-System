import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's GitHub token from your database - using 'as any' to bypass TypeScript type checking
    const { data: githubToken, error: tokenError } = await supabase
      .from('user_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single() as any

    if (tokenError || !githubToken) {
      console.error('Token error:', tokenError)
      return NextResponse.json(
        { error: 'GitHub account not connected' },
        { status: 400 }
      )
    }

    // Validate that we have an access token
    if (!githubToken.access_token) {
      return NextResponse.json(
        { error: 'Invalid GitHub token' },
        { status: 400 }
      )
    }

    // Fetch repos from GitHub
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `Bearer ${githubToken.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })

      // If token is invalid, remove it from database
      if (response.status === 401) {
        await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'github') as any
          
        return NextResponse.json(
          { error: 'GitHub token expired. Please reconnect your account.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: `Failed to fetch GitHub repos: ${response.statusText}` },
        { status: response.status }
      )
    }

    const repos = await response.json()

    // Format the response to include only necessary fields
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      language: repo.language,
      private: repo.private,
      updated_at: repo.updated_at,
    }))

    return NextResponse.json({ 
      success: true, 
      repos: formattedRepos,
      count: formattedRepos.length
    })
    
  } catch (error) {
    console.error('Error fetching GitHub repos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
