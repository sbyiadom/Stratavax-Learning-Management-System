import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DebugSimplePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  const steps: any[] = []
  
  try {
    // Step 1: Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    steps.push({ step: 'Get User', data: user, error: userError })

    // Step 2: Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', params.slug)
      .single()
    steps.push({ step: 'Get Course', data: course, error: courseError })

    if (!course) {
      steps.push({ step: 'Course Not Found', error: 'No course with slug: ' + params.slug })
      return renderDebug(params.slug, steps)
    }

    // Step 3: Check enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user?.id)
      .eq('course_id', course.id)
      .maybeSingle()
    steps.push({ step: 'Check Enrollment', data: enrollment, error: enrollError })

    // Step 4: Get modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, module_order')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true })
    steps.push({ step: 'Get Modules', data: modules, error: modulesError, count: modules?.length })

    // Step 5: If modules exist, get first lesson from first module
    let firstLesson = null
    if (modules && modules.length > 0) {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, lesson_order')
        .eq('module_id', modules[0].id)
        .order('lesson_order', { ascending: true })
        .limit(1)
        .maybeSingle()
      firstLesson = lesson
      steps.push({ step: 'Get First Lesson', data: lesson, error: lessonError })
    }

    // Step 6: Get all lessons for reference
    const { data: allLessons, error: allLessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        lesson_order,
        module_id
      `)
      .in('module_id', modules?.map(m => m.id) || [])
      .order('lesson_order', { ascending: true })
    steps.push({ step: 'Get All Lessons', data: allLessons, error: allLessonsError, count: allLessons?.length })

  } catch (error: any) {
    steps.push({ step: 'Unexpected Error', error: error.message })
  }

  return renderDebug(params.slug, steps)
}

function renderDebug(slug: string, steps: any[]) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug: {slug}</h1>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-lg mb-2">
                Step {index + 1}: {step.step}
              </h2>
              
              {step.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-2">
                  <strong>Error:</strong> {JSON.stringify(step.error)}
                </div>
              )}
              
              {step.data && (
                <div className="bg-green-50 p-3 rounded mb-2">
                  <strong>Success:</strong>
                  <pre className="mt-2 text-sm overflow-auto">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </div>
              )}

              {step.count !== undefined && (
                <p className="text-sm text-gray-600 mt-1">Count: {step.count}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href={`/dashboard/learn/${slug}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Learn Page
          </Link>
          <Link
            href={`/dashboard/courses/${slug}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Course Page
          </Link>
        </div>
      </div>
    </div>
  )
}
