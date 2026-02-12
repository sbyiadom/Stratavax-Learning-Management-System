import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub token from user metadata or database
    // For this example, we'll assume it's stored in user_metadata
    const githubToken = user.user_metadata?.github_token

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub account not connected. Please connect your GitHub account first.' },
        { status: 400 }
      )
    }

    // Fetch user's GitHub repositories
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'GitHub token expired. Please reconnect your GitHub account.' },
          { status: 401 }
        )
      }
      throw new Error('Failed to fetch GitHub repositories')
    }

    const repos = await response.json()

    // Format the response
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      updated_at: repo.updated_at,
      private: repo.private,
      default_branch: repo.default_branch,
    }))

    return NextResponse.json({ 
      success: true, 
      repositories: formattedRepos,
      count: formattedRepos.length 
    })
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub repositories' },
      { status: 500 }
    )
  }
}
