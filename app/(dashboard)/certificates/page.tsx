'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download } from 'lucide-react'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title, instructor)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
      
      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Certificates</h1>
      
      <div className="grid gap-4">
        {certificates.map((cert: any) => (
          <Card key={cert.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                {cert.courses?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Instructor: {cert.courses?.instructor}
              </p>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Certificate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
