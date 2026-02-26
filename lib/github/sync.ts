import { Octokit } from '@octokit/rest'
import { createAdminClient } from '@/lib/supabase-server'  // Fixed import

interface GitHubSyncOptions {
  courseId: string
  repoOwner: string
  repoName: string
  branch?: string
}

interface SyncResult {
  success: boolean
  filesProcessed: number
  errors: string[]
  details?: any
}

export async function syncCourseWithGitHub(options: GitHubSyncOptions): Promise<SyncResult> {
  const { courseId, repoOwner, repoName, branch = 'main' } = options
  const supabase = createAdminClient()
  const errors: string[] = []
  let filesProcessed = 0

  try {
    // Initialize Octokit
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GitHub token not configured')
    }
    const octokit = new Octokit({ auth: token })

    // Get course content from database
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        modules(
          *,
          lessons(*)
        )
      `)
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      throw new Error(`Course not found: ${courseError?.message || 'Unknown error'}`)
    }

    // Sync course metadata
    await syncCourseMetadata(octokit, repoOwner, repoName, branch, course)
    filesProcessed++

    // Sync modules and lessons
    if (course.modules) {
      for (const module of course.modules) {
        await syncModule(octokit, repoOwner, repoName, branch, courseId, module)
        filesProcessed++

        if (module.lessons) {
          for (const lesson of module.lessons) {
            await syncLesson(octokit, repoOwner, repoName, branch, courseId, module, lesson)
            filesProcessed++
          }
        }
      }
    }

    // Update sync record in database
    await supabase
      .from('github_syncs')
      .insert({
        course_id: courseId,
        repo_owner: repoOwner,
        repo_name: repoName,
        branch,
        synced_at: new Date().toISOString(),
        files_processed: filesProcessed,
        status: 'success'
      })

    return {
      success: true,
      filesProcessed,
      errors
    }

  } catch (error) {
    console.error('GitHub sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)

    // Log failed sync
    await supabase
      .from('github_syncs')
      .insert({
        course_id: courseId,
        repo_owner: repoOwner,
        repo_name: repoName,
        branch,
        synced_at: new Date().toISOString(),
        status: 'failed',
        error_message: errorMessage
      })

    return {
      success: false,
      filesProcessed,
      errors
    }
  }
}

async function syncCourseMetadata(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  course: any
) {
  const content = `# ${course.title}

${course.description || ''}

## Course Information
- **Level:** ${course.level || 'Not specified'}
- **Duration:** ${course.duration || 'Not specified'}
- **Instructor:** ${course.instructor || 'Not specified'}
- **Price:** ${course.price || 'Free'}

## Modules
${course.modules?.map((m: any) => `- ${m.title}`).join('\n') || 'No modules yet'}

---
*Last synced: ${new Date().toISOString()}*
`

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `courses/${course.id}/README.md`,
    message: `Sync course metadata: ${course.title}`,
    content: Buffer.from(content).toString('base64'),
    branch
  })
}

async function syncModule(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  courseId: string,
  module: any
) {
  const content = `# ${module.title}

${module.description || ''}

## Lessons
${module.lessons?.map((l: any) => `- ${l.title}`).join('\n') || 'No lessons yet'}

---
*Module ID: ${module.id}*
`

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `courses/${courseId}/modules/${module.id}/README.md`,
    message: `Sync module: ${module.title}`,
    content: Buffer.from(content).toString('base64'),
    branch
  })
}

async function syncLesson(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  courseId: string,
  module: any,
  lesson: any
) {
  const content = `# ${lesson.title}

${lesson.content || ''}

## Lesson Details
- **Duration:** ${lesson.duration || 'Not specified'}
- **Video URL:** ${lesson.video_url || 'No video'}

---
*Lesson ID: ${lesson.id}*
*Module ID: ${module.id}*
*Course ID: ${courseId}*
`

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `courses/${courseId}/modules/${module.id}/lessons/${lesson.id}.md`,
    message: `Sync lesson: ${lesson.title}`,
    content: Buffer.from(content).toString('base64'),
    branch
  })
}

export async function getSyncHistory(courseId: string) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('github_syncs')
    .select('*')
    .eq('course_id', courseId)
    .order('synced_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch sync history: ${error.message}`)
  }

  return data
}

export async function getGitHubRepos() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GitHub token not configured')
  }

  const octokit = new Octokit({ auth: token })
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100
  })

  return repos.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    private: repo.private,
    description: repo.description,
    url: repo.html_url,
    default_branch: repo.default_branch
  }))
}

export async function getRepoContents(owner: string, repo: string, path: string = '') {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GitHub token not configured')
  }

  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path
  })

  return data
}
