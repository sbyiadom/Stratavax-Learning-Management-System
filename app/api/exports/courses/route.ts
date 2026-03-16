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

    // Check if user is admin - using profiles_roles table (from your schema)
    const { data: userRole, error: roleError } = await supabase
      .from('profiles_roles')
      .select('role')
      .eq('user_id', user.id)
      .single() as any

    if (roleError) {
      console.error('Error checking user role:', roleError)
    }

    // Check if user has admin role
    const isAdmin = userRole && (userRole.role === 'admin' || userRole.role === 'super_admin')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch all courses with related data - using 'as any' to bypass TypeScript type checking
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments (
          user_id,
          progress_percentage,
          enrolled_at,
          status
        ),
        modules (
          id,
          title,
          lessons (
            id,
            title
          )
        )
      `)
      .order('created_at', { ascending: false }) as any

    if (error) {
      console.error('Error fetching courses:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Transform the data to include counts
    const transformedCourses = courses?.map((course: any) => ({
      ...course,
      total_enrollments: course.enrollments?.length || 0,
      total_modules: course.modules?.length || 0,
      total_lessons: course.modules?.reduce((acc: number, module: any) => 
        acc + (module.lessons?.length || 0), 0) || 0
    })) || []

    return NextResponse.json({ 
      success: true,
      courses: transformedCourses,
      total: transformedCourses.length
    })
    
  } catch (error) {
    console.error('Error in course export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
