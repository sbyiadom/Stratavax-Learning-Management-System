import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const course = searchParams.get('course')
    
    // Build evaluation query
    let evalQuery = supabase
      .from('training_evaluations')
      .select(`
        *,
        training_record:training_records (
          attendee_name,
          course,
          training_date,
          facilitator,
          department
        )
      `)
    
    if (startDate) {
      evalQuery = evalQuery.gte('training_date', startDate)
    }
    if (endDate) {
      evalQuery = evalQuery.lte('training_date', endDate)
    }
    if (course) {
      evalQuery = evalQuery.eq('course', course)
    }
    
    const { data: evaluations, error: evalError } = await evalQuery
    
    if (evalError) {
      console.error('Error fetching evaluations:', evalError)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: 500 }
      )
    }
    
    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        averages: {
          content: 0,
          facilitator: 0,
          logistics: 0,
          engagement: 0,
          applicability: 0,
          overall: 0
        },
        wordCloud: [],
        recentEvaluations: [],
        byCourse: [],
        ratingDistribution: {
          content: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          facilitator: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      })
    }
    
    // Calculate averages
    const totals = evaluations.reduce((acc, e) => ({
      content: acc.content + (e.content_rating || 0),
      facilitator: acc.facilitator + (e.facilitator_rating || 0),
      logistics: acc.logistics + (e.logistics_rating || 0),
      engagement: acc.engagement + (e.engagement_rating || 0),
      applicability: acc.applicability + (e.applicability_rating || 0)
    }), { content: 0, facilitator: 0, logistics: 0, engagement: 0, applicability: 0 })
    
    const totalRatings = evaluations.length
    
    const averages = {
      content: Math.round((totals.content / totalRatings) * 10) / 10,
      facilitator: Math.round((totals.facilitator / totalRatings) * 10) / 10,
      logistics: Math.round((totals.logistics / totalRatings) * 10) / 10,
      engagement: Math.round((totals.engagement / totalRatings) * 10) / 10,
      applicability: Math.round((totals.applicability / totalRatings) * 10) / 10,
      overall: Math.round(((totals.content + totals.facilitator + totals.logistics + totals.engagement + totals.applicability) / (totalRatings * 5)) * 10) / 10
    }
    
    // Generate word cloud
    const wordCount: Map<string, number> = new Map()
    evaluations.forEach(e => {
      if (e.one_word) {
        const word = e.one_word.toLowerCase().trim()
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })
    
    const wordCloud = Array.from(wordCount.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
    
    // Calculate rating distribution
    const ratingDistribution = {
      content: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      facilitator: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
    
    evaluations.forEach(e => {
      if (e.content_rating) ratingDistribution.content[e.content_rating as keyof typeof ratingDistribution.content]++
      if (e.facilitator_rating) ratingDistribution.facilitator[e.facilitator_rating as keyof typeof ratingDistribution.facilitator]++
      const overallRating = Math.round(((e.content_rating || 0) + (e.facilitator_rating || 0) + (e.logistics_rating || 0) + (e.engagement_rating || 0) + (e.applicability_rating || 0)) / 5)
      if (overallRating > 0) ratingDistribution.overall[overallRating as keyof typeof ratingDistribution.overall]++
    })
    
    // Group by course
    const byCourseMap: Map<string, any> = new Map()
    evaluations.forEach(e => {
      const courseName = e.course || 'Unknown'
      if (!byCourseMap.has(courseName)) {
        byCourseMap.set(courseName, {
          course: courseName,
          total: 0,
          sum: { content: 0, facilitator: 0, logistics: 0, engagement: 0, applicability: 0 }
        })
      }
      const courseData = byCourseMap.get(courseName)
      courseData.total++
      courseData.sum.content += e.content_rating || 0
      courseData.sum.facilitator += e.facilitator_rating || 0
      courseData.sum.logistics += e.logistics_rating || 0
      courseData.sum.engagement += e.engagement_rating || 0
      courseData.sum.applicability += e.applicability_rating || 0
    })
    
    const byCourse = Array.from(byCourseMap.values()).map(c => ({
      course: c.course,
      total: c.total,
      content: Math.round((c.sum.content / c.total) * 10) / 10,
      facilitator: Math.round((c.sum.facilitator / c.total) * 10) / 10,
      logistics: Math.round((c.sum.logistics / c.total) * 10) / 10,
      engagement: Math.round((c.sum.engagement / c.total) * 10) / 10,
      applicability: Math.round((c.sum.applicability / c.total) * 10) / 10,
      overall: Math.round(((c.sum.content + c.sum.facilitator + c.sum.logistics + c.sum.engagement + c.sum.applicability) / (c.total * 5)) * 10) / 10
    })).sort((a, b) => b.overall - a.overall)
    
    // Get recent evaluations
    const recentEvaluations = evaluations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        attendee_name: e.training_record?.attendee_name,
        course: e.course,
        training_date: e.training_date,
        content_rating: e.content_rating,
        facilitator_rating: e.facilitator_rating,
        logistics_rating: e.logistics_rating,
        engagement_rating: e.engagement_rating,
        applicability_rating: e.applicability_rating,
        overall: Math.round(((e.content_rating || 0) + (e.facilitator_rating || 0) + (e.logistics_rating || 0) + (e.engagement_rating || 0) + (e.applicability_rating || 0)) / 5),
        one_word: e.one_word,
        comments: e.comments
      }))
    
    return NextResponse.json({
      success: true,
      total: totalRatings,
      averages,
      wordCloud,
      ratingDistribution,
      recentEvaluations,
      byCourse
    })
    
  } catch (error) {
    console.error('Error in training stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
