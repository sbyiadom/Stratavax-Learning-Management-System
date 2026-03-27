import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Check if this is a webhook from Google Apps Script
    const authHeader = request.headers.get('authorization')
    const isGoogleWebhook = authHeader === `Bearer ${process.env.GOOGLE_FORMS_WEBHOOK_SECRET}`
    
    let userId = null
    
    if (isGoogleWebhook) {
      // For Google Forms webhook, use system user or null
      userId = process.env.SYSTEM_USER_ID || null
    } else {
      // For manual submissions, verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    // Validate formId
    if (!params.formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Save raw form submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: params.formId,
        user_id: userId,
        submission_data: body,
        created_at: new Date().toISOString()
      } as any)
      .select()
      .single()

    if (submissionError) {
      console.error('Error saving form submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to save form submission' },
        { status: 500 }
      )
    }

    // Process training registration if this is the training form
    if (params.formId === process.env.TRAINING_REGISTER_FORM_ID) {
      await processTrainingRegistration(supabase, body, submission.id)
    }

    return NextResponse.json({ 
      success: true, 
      data: submission,
      message: 'Form submitted successfully' 
    })
    
  } catch (error) {
    console.error('Error in Google Forms submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processTrainingRegistration(supabase: any, formData: any, submissionId: string) {
  try {
    // Calculate duration in hours
    const durationHours = formData.durationMinutes ? formData.durationMinutes / 60 : 0

    // Create training record
    const trainingRecord = {
      attendee_name: formData.attendeeName || '',
      role: formData.role || '',
      course: formData.course || '',
      facilitator: formData.facilitator || '',
      supervisor: formData.lineManager || '',
      department: formData.location || '',
      duration_hours: durationHours,
      training_date: formData.trainingDate || new Date().toISOString().split('T')[0],
      personnel_number: formData.personnelNumber || '',
      country: formData.country || '',
      location: formData.location || '',
      line_manager: formData.lineManager || '',
      acknowledged: formData.acknowledged === 'Yes',
      source: 'google_form',
      form_submission_id: submissionId,
      submitted_at: formData.submittedAt || new Date().toISOString()
    }

    const { data: record, error: recordError } = await supabase
      .from('training_records')
      .insert(trainingRecord)
      .select()
      .single()

    if (recordError) {
      console.error('Error creating training record:', recordError)
      await supabase
        .from('form_submissions')
        .update({ 
          error_message: recordError.message, 
          processed: false 
        })
        .eq('id', submissionId)
      return
    }

    console.log(`✅ Training record created: ${trainingRecord.attendee_name} - ${trainingRecord.course}`)

    // Insert evaluation if ratings exist
    if (formData.contentRating || formData.facilitatorRating || 
        formData.logisticsRating || formData.engagementRating || 
        formData.applicabilityRating) {
      
      const evaluation = {
        training_record_id: record.id,
        personnel_number: formData.personnelNumber || '',
        attendee_name: formData.attendeeName,
        course: formData.course,
        training_date: formData.trainingDate,
        content_rating: formData.contentRating || null,
        facilitator_rating: formData.facilitatorRating || null,
        logistics_rating: formData.logisticsRating || null,
        engagement_rating: formData.engagementRating || null,
        applicability_rating: formData.applicabilityRating || null,
        comments: formData.comments || '',
        one_word: formData.oneWord || ''
      }

      const { error: evalError } = await supabase
        .from('training_evaluations')
        .insert(evaluation)

      if (evalError) {
        console.error('Error creating evaluation:', evalError)
      } else {
        console.log(`✅ Evaluation created for ${trainingRecord.attendee_name}`)
      }
    }

    // Update submission as processed
    await supabase
      .from('form_submissions')
      .update({
        processed: true,
        training_record_id: record.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', submissionId)

  } catch (error) {
    console.error('Error processing training registration:', error)
    await supabase
      .from('form_submissions')
      .update({
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processed: false
      })
      .eq('id', submissionId)
  }
}
