import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Octokit } from '@octokit/rest'

export async function GET(request: NextRequest) {
  try {
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
    }

    const octokit = new Octokit({ auth: token })

    if (owner && repo) {
      // Get specific repo
      const { data: repository } = await octokit.repos.get({ owner, repo })
      return NextResponse.json({ repository })
    } else {
      // List repos for the authenticated user
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      })
      return NextResponse.json({ repos })
    }

  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, action } = await request.json()

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
    }

    const octokit = new Octokit({ auth: token })

    if (action === 'sync') {
      // Sync repository data (example: get contents)
      const { data: contents } = await octokit.repos.getContent({
        owner,
        repo,
        path: ''
      })

      // Store sync record in database
      await supabase
        .from('github_syncs')
        .insert({
          user_id: user.id,
          owner,
          repo,
          synced_at: new Date().toISOString()
        })

      return NextResponse.json({ 
        success: true, 
        message: 'Repository synced successfully',
        contents 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to process GitHub request' },
      { status: 500 }
    )
  }
}
