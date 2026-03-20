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

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch all courses with enrollment data
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments (
          user_id,
          progress,
          enrolled_at
        ),
        modules (
          id,
          title
        )
      `)

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Generate CSV or Excel export
    const exportData = courses.map(course => ({
      'Course ID': course.id,
      'Course Title': course.title,
      'Enrollments': course.enrollments?.length || 0,
      'Modules': course.modules?.length || 0,
      'Created At': new Date(course.created_at).toLocaleDateString(),
    }))

    return NextResponse.json({ data: exportData })
  } catch (error) {
    console.error('Error in course export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
