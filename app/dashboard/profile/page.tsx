import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Award, 
  BookOpen, 
  Clock, 
  TrendingUp,
  Settings,
  Mail,
  Calendar,
  Edit
} from 'lucide-react'
import ProfileEditButton from '@/components/dashboard/ProfileEditButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user stats
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)

  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', true)

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)

  const { data: achievements } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements(*)
    `)
    .eq('user_id', user.id)

  // Calculate total learning time (estimate: 12 min per lesson)
  const totalLearningMinutes = (completedLessons || 0) * 12
  const totalLearningHours = Math.round(totalLearningMinutes / 60)

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons(
        title,
        module:modules(
          course:courses(
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(5)

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile?.full_name || user.email?.split('@')[0]}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-600">Member since {memberSince}</span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <ProfileEditButton profile={profile} />

              {/* Stats Summary */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Courses enrolled</span>
                    <span className="font-medium">{enrollments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lessons completed</span>
                    <span className="font-medium">{completedLessons || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Certificates earned</span>
                    <span className="font-medium">{certificates?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Learning time</span>
                    <span className="font-medium">{totalLearningHours} hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity and Achievements */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrolled</p>
                    <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold">{completedLessons || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Certificates</p>
                    <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/dashboard/learn/${activity.lessons?.module?.courses?.slug}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {activity.lessons?.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          in {activity.lessons?.module?.courses?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Achievements</h3>
              {achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.map((ua) => (
                    <div
                      key={ua.id}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg text-center"
                    >
                      <div className="text-3xl mb-2">{ua.achievements?.icon || '🏆'}</div>
                      <h4 className="font-semibold text-sm">{ua.achievements?.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{ua.achievements?.points} points</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No achievements yet</p>
                  <p className="text-sm text-gray-400 mt-1">Complete lessons to earn achievements</p>
                </div>
              )}
            </div>

            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">My Certificates</h3>
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <Link
                      key={cert.id}
                      href={`/dashboard/certificates/${cert.course_id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Award size={24} className="text-yellow-500" />
                        <div>
                          <p className="font-medium">Course Certificate</p>
                          <p className="text-sm text-gray-500">
                            Issued {new Date(cert.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-blue-600">View →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
