import { Octokit } from '@octokit/rest'
import { createAdminClient } from '@/lib/supabase'

interface GitHubSyncOptions {
  courseId: string
  repoUrl: string
  branch?: string
  syncContent?: boolean
  syncMetadata?: boolean
}

export async function syncCourseFromGitHub(options: GitHubSyncOptions) {
  const {
    courseId,
    repoUrl,
    branch = 'main',
    syncContent = true,
    syncMetadata = true,
  } = options

  const supabase = createAdminClient()
  
  try {
    // Parse GitHub repo info
    const repoMatch = repoUrl.match(/github\.com[/:]([^\/]+)\/([^\/\.]+)/)
    if (!repoMatch) throw new Error('Invalid GitHub repository URL')
    
    const [, owner, repo] = repoMatch
    
    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })

    // Verify repository exists and is accessible
    try {
      await octokit.repos.get({ owner, repo })
    } catch (error) {
      throw new Error(`Repository ${owner}/${repo} not found or not accessible`)
    }

    // Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
      ref: branch,
    })

    if (!Array.isArray(contents)) {
      throw new Error('Invalid repository structure')
    }

    // Parse course structure from GitHub
    const modules = await parseGitHubStructure(contents, owner, repo, branch)
    
    // Clear existing modules for this course
    await supabase
      .from('modules')
      .delete()
      .eq('course_id', courseId)

    // Save modules and lessons to database
    for (const moduleData of modules) {
      // Insert module
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: moduleData.title,
          module_order: moduleData.order,
          description: moduleData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (moduleError) {
        console.error('Error creating module:', moduleError)
        continue
      }

      // Insert lessons
      for (const lessonData of moduleData.lessons) {
        await supabase
          .from('lessons')
          .insert({
            module_id: module.id,
            title: lessonData.title,
            content_type: lessonData.type,
            content_url: lessonData.url,
            content: lessonData.content,
            lesson_order: lessonData.order,
            duration_minutes: lessonData.duration || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
    }

    // Update course metadata
    if (syncMetadata) {
      const { data: repoData } = await octokit.repos.get({ owner, repo })
      
      await supabase
        .from('courses')
        .update({
          github_repo: repoUrl,
          github_branch: branch,
          github_last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
    }

    return { 
      success: true, 
      modules: modules.length,
      lessons: modules.reduce((acc, m) => acc + m.lessons.length, 0),
      courseId 
    }
  } catch (error) {
    console.error('Error syncing from GitHub:', error)
    throw error
  }
}

async function parseGitHubStructure(
  contents: any[],
  owner: string,
  repo: string,
  branch: string
) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })

  const modules = []
  
  // Look for module folders
  const moduleFolders = contents.filter(item => 
    item.type === 'dir' && 
    (item.name.toLowerCase().includes('module') || 
     item.name.toLowerCase().includes('chapter') ||
     item.name.toLowerCase().includes('section'))
  )
  
  // If no module folders found, look for markdown files in root
  if (moduleFolders.length === 0) {
    const markdownFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.endsWith('.md') || item.name.endsWith('.mdx'))
    )
    
    if (markdownFiles.length > 0) {
      modules.push({
        title: 'Course Content',
        description: 'Main course materials',
        order: 1,
        lessons: await Promise.all(markdownFiles.map(async (file, index) => {
          let content = ''
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path,
              ref: branch,
            })
            if ('content' in data && data.content) {
              content = Buffer.from(data.content, 'base64').toString('utf-8')
            }
          } catch (error) {
            console.error('Error fetching file content:', error)
          }

          return {
            title: file.name.replace(/\.mdx?$/, '').replace(/-/g, ' '),
            type: 'article',
            url: file.download_url,
            content,
            order: index + 1,
            duration: 15, // Default duration for articles
          }
        }))
      })
    }
    
    return modules
  }

  // Sort modules
  moduleFolders.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0')
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0')
    return numA - numB
  })

  for (let i = 0; i < moduleFolders.length; i++) {
    const folder = moduleFolders[i]
    
    // Get module contents
    const { data: moduleContents } = await octokit.repos.getContent({
      owner,
      repo,
      path: folder.path,
      ref: branch,
    })

    if (!Array.isArray(moduleContents)) continue

    const lessons = []
    
    // Look for lesson files
    const lessonFiles = moduleContents.filter(item => 
      item.type === 'file' && 
      (item.name.endsWith('.md') || 
       item.name.endsWith('.mdx') || 
       item.name.endsWith('.mp4') ||
       item.name.endsWith('.pdf'))
    )

    // Sort lessons
    lessonFiles.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0')
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0')
      return numA - numB
    })

    for (let j = 0; j < lessonFiles.length; j++) {
      const file = lessonFiles[j]
      
      let content = ''
      if (file.name.endsWith('.md') || file.name.endsWith('.mdx')) {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: branch,
          })
          if ('content' in data && data.content) {
            content = Buffer.from(data.content, 'base64').toString('utf-8')
          }
        } catch (error) {
          console.error('Error fetching file content:', error)
        }
      }

      lessons.push({
        title: file.name
          .replace(/\.(md|mdx|mp4|pdf)$/, '')
          .replace(/-/g, ' ')
          .replace(/\d+/g, '')
          .trim(),
        type: file.name.endsWith('.mp4') ? 'video' : 
              file.name.endsWith('.pdf') ? 'resource' : 'article',
        url: file.download_url,
        content,
        order: j + 1,
        duration: file.name.endsWith('.mp4') ? 30 : 
                  file.name.endsWith('.pdf') ? 10 : 15,
      })
    }

    modules.push({
      title: folder.name
        .replace(/-/g, ' ')
        .replace(/module/i, 'Module')
        .replace(/\d+/g, (match: string) => ` ${match}`)
        .trim(),
      description: `Module ${i + 1}: ${folder.name.replace(/-/g, ' ')}`,
      order: i + 1,
      lessons,
    })
  }

  return modules
}

export async function getGitHubRepoContents(owner: string, repo: string, path: string = '') {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    })

    return data
  } catch (error) {
    console.error('Error fetching repository contents:', error)
    throw error
  }
}

export async function validateGitHubRepo(repoUrl: string): Promise<boolean> {
  try {
    const repoMatch = repoUrl.match(/github\.com[/:]([^\/]+)\/([^\/\.]+)/)
    if (!repoMatch) return false

    const [, owner, repo] = repoMatch
    
    const octokit = new Octokit()
    await octokit.repos.get({ owner, repo })
    
    return true
  } catch (error) {
    return false
  }
}
