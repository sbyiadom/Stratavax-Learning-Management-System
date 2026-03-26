import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { Octokit } from '@octokit/rest'

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

    // Get user's GitHub token from user_connections
    const { data: connection, error: connectionError } = await supabase
      .from('user_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .maybeSingle()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      )
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({
      auth: connection.access_token
    })

    // Get user's repositories
    const { data: repos, error: reposError } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })

    if (reposError) {
      console.error('Error fetching repos:', reposError)
      return NextResponse.json(
        { error: 'Failed to fetch repositories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at
      }))
    })
  } catch (error) {
    console.error('Error in GitHub repos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
