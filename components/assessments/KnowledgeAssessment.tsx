'use client'

import AssessmentForm from './AssessmentForm'

interface KnowledgeAssessmentProps {
  registrationId: string
  courseTitle: string
  userId: string
}

export default function KnowledgeAssessment({ 
  registrationId, 
  courseTitle, 
  userId 
}: KnowledgeAssessmentProps) {
  const handleSaved = () => {
    // Optional: refresh data or show message
    console.log('Assessment saved successfully')
  }

  return (
    <AssessmentForm
      registrationId={registrationId}
      courseTitle={courseTitle}
      userId={userId}
      onSaved={handleSaved}
    />
  )
}
