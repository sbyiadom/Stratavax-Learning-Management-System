'use client'

import { Award, Download, Share2, Calendar } from 'lucide-react'
import Link from 'next/link'

interface CertificateProps {
  id: string
  courseTitle: string
  courseSlug: string
  issuedDate: string
  certificateUrl?: string
}

export default function CertificateCard({ 
  id, 
  courseTitle, 
  courseSlug, 
  issuedDate,
  certificateUrl 
}: CertificateProps) {
  const handleDownload = () => {
    // Implement PDF download logic
    window.open(certificateUrl, '_blank')
  }

  const handleShare = () => {
    navigator.share?.({
      title: `Certificate of Completion: ${courseTitle}`,
      text: `I completed ${courseTitle} on Stratavax LMS!`,
      url: `${window.location.origin}/certificates/${id}`
    })
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{courseTitle}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="w-3 h-3" />
            <span>Issued: {new Date(issuedDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/certificates/${id}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View Certificate
            </Link>
            <button
              onClick={handleDownload}
              className="text-xs text-gray-600 hover:text-gray-700 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="text-xs text-gray-600 hover:text-gray-700 flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          </div>
        </div>
        <div className="text-3xl">🎓</div>
      </div>
    </div>
  )
}
