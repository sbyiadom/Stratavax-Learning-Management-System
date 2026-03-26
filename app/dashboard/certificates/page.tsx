'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Award, 
  Download, 
  Calendar, 
  ExternalLink,
  CheckCircle,
  BookOpen,
  Printer,
  Share2,
  Mail,
  Twitter,
  Linkedin,
  Loader2,
  GraduationCap,
  Clock,
  Star
} from 'lucide-react'

interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  issued_at: string
  created_at: string
  courses?: {
    id: string
    title: string
    slug: string
    description: string
    duration_hours: number
    difficulty_level: string
    category: string
    instructor: string | null
  } | null
}

interface CompletedCourse {
  id: string
  course_id: string
  progress_percentage: number
  completed_at: string | null
  courses: {
    title: string
    slug: string
  } | null
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        return
      }
      
      setUser(authUser)
      
      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', authUser.id)
        .single()
      
      setProfile(profileData)
      
      // Get certificates with course details
      const { data: certificatesData, error: certError } = await supabase
        .from('certificates')
        .select(`
          *,
          courses:course_id (
            id,
            title,
            slug,
            description,
            duration_hours,
            difficulty_level,
            category,
            instructor
          )
        `)
        .eq('user_id', authUser.id)
        .order('issued_at', { ascending: false })
      
      if (!certError && certificatesData) {
        setCertificates(certificatesData)
      }
      
      // Get completed courses (100% progress)
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          progress_percentage,
          completed_at,
          courses:course_id (
            title,
            slug
          )
        `)
        .eq('user_id', authUser.id)
        .eq('progress_percentage', 100)
      
      setCompletedCourses(enrollmentsData || [])
      
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCertificateHTML = (certificate: Certificate) => {
    const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : user?.email?.split('@')[0] || 'Learner'
    const issueDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion - ${certificate.courses?.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #e5e7eb;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 40px;
    }
    .certificate {
      width: 1000px;
      background: white;
      border: 20px solid #f3f4f6;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .certificate-inner {
      border: 2px solid #e5e7eb;
      padding: 60px 50px;
      position: relative;
      background: linear-gradient(to bottom, #fff, #fef9e6);
    }
    .border-decoration {
      position: absolute;
      top: 20px; left: 20px; right: 20px; bottom: 20px;
      border: 1px solid #d1d5db;
      pointer-events: none;
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-icon {
      display: inline-block;
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .certificate-title {
      text-align: center;
      font-size: 48px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
      letter-spacing: 4px;
    }
    .subtitle {
      text-align: center;
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 40px;
      font-style: italic;
    }
    .recipient { text-align: center; margin: 40px 0; }
    .recipient-name {
      font-size: 48px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 15px;
      font-family: 'Courier New', monospace;
    }
    .recipient-desc { font-size: 18px; color: #4b5563; }
    .course-info {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #f9fafb;
      border-radius: 16px;
    }
    .course-title {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
    }
    .course-details {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .course-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
    }
    .date { text-align: center; margin: 30px 0; font-size: 16px; color: #6b7280; }
    .certificate-number {
      text-align: center;
      margin: 20px 0;
      font-size: 12px;
      color: #9ca3af;
      font-family: monospace;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .signature { text-align: center; }
    .signature-line { width: 200px; height: 2px; background: #1f2937; margin: 10px 0; }
    .signature-name { font-weight: bold; color: #1f2937; }
    .signature-title { font-size: 12px; color: #6b7280; }
    .seal {
      position: absolute;
      bottom: 80px;
      right: 80px;
      width: 100px;
      height: 100px;
      border: 3px solid #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #3b82f6;
      text-align: center;
      opacity: 0.3;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-inner">
      <div class="border-decoration"></div>
      <div class="logo">
        <div class="logo-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
            <path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6"/>
          </svg>
        </div>
        <div class="logo-text">Stratavax</div>
      </div>
      <div class="certificate-title">CERTIFICATE OF COMPLETION</div>
      <div class="subtitle">This certificate is proudly presented to</div>
      <div class="recipient">
        <div class="recipient-name">${fullName}</div>
        <div class="recipient-desc">for successfully completing the course</div>
      </div>
      <div class="course-info">
        <div class="course-title">${certificate.courses?.title}</div>
        <div class="course-details">
          <span class="course-detail">📚 ${certificate.courses?.duration_hours || 0} hours</span>
          <span class="course-detail">⭐ ${certificate.courses?.difficulty_level || 'All levels'}</span>
          <span class="course-detail">🏷️ ${certificate.courses?.category || 'Course'}</span>
        </div>
      </div>
      <div class="date">Issued on ${issueDate}</div>
      <div class="signatures">
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">Dr. Sarah Johnson</div>
          <div class="signature-title">Director of Learning</div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">Prof. Michael Chen</div>
          <div class="signature-title">Academic Advisor</div>
        </div>
      </div>
      <div class="certificate-number">Certificate ID: ${certificate.certificate_number}</div>
      <div class="seal"><div>STRATAVAX<br>LEARNING</div></div>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadCertificate = async (certificate: Certificate) => {
    const html = generateCertificateHTML(certificate);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${certificate.certificate_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCertificate = (certificate: Certificate) => {
    const html = generateCertificateHTML(certificate);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const shareOnSocial = (platform: string, certificate: Certificate) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`I just earned my ${certificate.courses?.title} certificate from Stratavax! 🎓`);
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=Certificate%20of%20Completion&summary=${text}`,
      email: `mailto:?subject=${encodeURIComponent('My Stratavax Certificate')}&body=${text}%0A%0AView it here: ${url}`
    };
    window.open(shareUrls[platform], '_blank');
  };

  const getCompletedButNoCertificate = () => {
    const completedCourseIds = new Set(completedCourses.map(c => c.course_id));
    const certificateCourseIds = new Set(certificates.map(c => c.course_id));
    return completedCourses.filter(c => !certificateCourseIds.has(c.course_id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-1">View and download your course completion certificates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Certificates Earned</p>
                <p className="text-3xl font-bold">{certificates.length}</p>
              </div>
              <Award size={32} className="text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Courses Completed</p>
                <p className="text-3xl font-bold">{completedCourses.length}</p>
              </div>
              <CheckCircle size={32} className="text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Hours</p>
                <p className="text-3xl font-bold">
                  {certificates.reduce((acc, cert) => acc + (cert.courses?.duration_hours || 0), 0)}
                </p>
              </div>
              <BookOpen size={32} className="text-purple-200" />
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100 group"
              >
                {/* Certificate Preview */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Award size={48} className="text-white opacity-75" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-2 py-1 text-xs font-medium text-gray-700">
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Certificate Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{cert.courses?.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {cert.courses?.difficulty_level || 'All levels'}
                    </span>
                    <span className="text-xs text-gray-500">{cert.courses?.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cert.courses?.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar size={12} />
                    <span>Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadCertificate(cert)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      onClick={() => printCertificate(cert)}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <Printer size={16} />
                    </button>
                    <div className="relative group/share">
                      <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                        <Share2 size={16} />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all z-10">
                        <button
                          onClick={() => shareOnSocial('twitter', cert)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                        >
                          <Twitter size={16} /> Twitter
                        </button>
                        <button
                          onClick={() => shareOnSocial('linkedin', cert)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Linkedin size={16} /> LinkedIn
                        </button>
                        <button
                          onClick={() => shareOnSocial('email', cert)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                        >
                          <Mail size={16} /> Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={48} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-6">Complete courses to earn certificates</p>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Courses
              <ExternalLink size={16} />
            </Link>
          </div>
        )}

        {/* Courses Completed Without Certificate (if any) */}
        {getCompletedButNoCertificate().length > 0 && (
          <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Pending Certificates</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  You have completed {getCompletedButNoCertificate().length} course(s) but certificates are being generated.
                  They will appear here shortly.
                </p>
                <Link
                  href="/dashboard/progress"
                  className="text-sm text-yellow-800 hover:text-yellow-900 font-medium inline-flex items-center gap-1"
                >
                  View your progress
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
