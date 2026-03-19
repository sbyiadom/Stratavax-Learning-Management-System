'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  id: string
  type: 'multiple-choice' | 'true-false'
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting,
