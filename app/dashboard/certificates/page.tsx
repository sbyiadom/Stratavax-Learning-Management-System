'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download } from 'lucide-react'

// Define the type for certificate data
interface Certificate {
  id: string
  course_id: string
  progress_percentage: number
  status: string
  completed_at?: string
  updated_at: string
  courses: {
    title: string
    instructor: string | null
  } | null
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchCertificates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            progress_percentage,
            status,
            updated_at,
            courses:course_id (
              title,
              instructor
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
        
        if (error) throw error
        
        if (data && isMounted) {
          setCertificates(data as unknown as Certificate[])
        } else if (isMounted) {
          setCertificates([])
        }
      } catch (error) {
        console.error('Error fetching certificates:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCertificates()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleDownload = (certificate: Certificate) => {
    // In a real app, you would generate and download a PDF certificate
    alert(`Download certificate for: ${certificate.courses?.title}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Certificates</h1>
      
      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No certificates earned yet</p>
            <p className="text-sm text-gray-400">
              Complete courses to earn certificates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span className="line-clamp-2">{cert.courses?.title || 'Untitled Course'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Instructor: {cert.courses?.instructor || 'N/A'}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Completed: {new Date(cert.updated_at).toLocaleDateString()}
                </p>
                <Button 
                  onClick={() => handleDownload(cert)}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
