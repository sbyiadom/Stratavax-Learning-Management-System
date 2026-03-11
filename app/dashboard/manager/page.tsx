'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  ChevronRight, 
  Award, 
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  BarChart3,
  Download,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  Star,
  Trophy,
  Filter,
  UserCircle,
  Mail,
  Phone
} from 'lucide-react'

type StudentProfile = {
  id: string
  full_name: string
  email: string
  department: string | null
  role: string | null
  avatar_url: string | null
  total_points: number
  enrolled_courses: number
  completed_courses: number
  in_progress_courses: number
  last_active?: string
}

type ManagerStats = {
  totalStudents: number
  totalEnrollments: number
  totalCompletions: number
  averageProgress: number
  topPerformers: StudentProfile[]
}

export default function ManagerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [stats, setStats] = useState<ManagerStats>({
    totalStudents: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    averageProgress: 0,
    topPerformers: []
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadManagerData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch all students with their enrollment data
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          enrollments (
            course_id,
            progress_percentage,
            status,
            completed_at
          )
        `)
        .order('total_points', { ascending: false })

      if (error) {
        console.error('Error fetching students:', error)
      }

      if (profiles) {
        // Calculate stats for each student
        const studentsWithStats: StudentProfile[] = profiles.map(profile => {
          const enrollments = profile.enrollments || []
          const completed = enrollments.filter((e: any) => e.completed_at).length
          const inProgress = enrollments.filter((e: any) => e.status === 'active' && !e.completed_at).length
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            department: profile.department,
            role: profile.role,
            avatar_url: profile.avatar_url,
            total_points: profile.total_points || 0,
            enrolled_courses: enrollments.length,
            completed_courses: completed,
            in_progress_courses: inProgress,
            last_active: new Date().toISOString().split('T')[0] // This would come from a last_active field
          }
        })

        setStudents(studentsWithStats)

        // Extract unique departments
        const uniqueDepts = Array.from(
          new Set(studentsWithStats.map(s => s.department).filter(Boolean))
        ) as string[]
        setDepartments(uniqueDepts)

        // Calculate overall stats
        const totalStudents = studentsWithStats.length
        const totalEnrollments = studentsWithStats.reduce((acc, s) => acc + s.enrolled_courses, 0)
        const totalCompletions = studentsWithStats.reduce((acc, s) => acc + s.completed_courses, 0)
        const averageProgress = totalEnrollments > 0 
          ? Math.round((totalCompletions / totalEnrollments) * 100) 
          : 0

        // Get top performers
        const topPerformers = [...studentsWithStats]
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 3)

        setStats({
          totalStudents,
          totalEnrollments,
          totalCompletions,
          averageProgress,
          topPerformers
        })
      }

      setLoading(false)
    }

    loadManagerData()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Manager Dashboard...</p>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter(student => {
    const matchesDepartment = selectedDepartment === 'all' || student.department === selectedDepartment
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.role && student.role.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesDepartment && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
