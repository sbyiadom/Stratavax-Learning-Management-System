'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Home,
  Layout,
  GraduationCap,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  PlayCircle,
  Star,
  Sparkles,
  Trophy,
  Medal,
  UserCircle,
  LogOut,
  Menu,
  X,
  Grid,
  BookMarked,
  FileText,
  Target,
  PieChart,
  Calendar,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Circle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Share2,
  MoreHorizontal,
  Plus,
  Minus,
  ThumbsUp,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Star as StarIcon,
  Sparkles as SparklesIcon,
  Flame,
  Zap,
  Activity,
  TrendingUp as TrendingUpIcon,
  BarChart,
  PieChart as PieChartIcon,
  LineChart,
  Database,
  Shield,
  Lock as LockIcon,
  Key,
  Fingerprint,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Cpu,
  HardDrive,
  Monitor,
  Printer,
  Scanner,
  Camera,
  Speaker,
  Mic,
  Headphones,
  Mouse,
  Keyboard,
  Tablet,
  Smartphone,
  Watch,
  Tv,
  Radio,
  Drone,
  Robot,
  Car,
  Bike,
  Train,
  Plane,
  Ship,
  Truck,
  Bus,
  Motorcycle,
  Tractor,
  Rocket,
  Satellite,
  Space,
  Globe,
  Map,
  Compass,
  Flag,
  Mountain,
  Tree,
  Flower,
  Cloud as CloudIcon,
  Sun,
  Moon,
  Star as StarIcon2,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Droplet,
  Waves,
  Flame as FlameIcon,
  Zap as ZapIcon,
  Activity as ActivityIcon
} from 'lucide-react'

// Approved course slugs
const APPROVED_COURSE_SLUGS = [
  'electrical-engineering',
  'microsoft-office',
  'programming-fundamentals',
  'web-development',
  'data-analysis',
  'ai-fundamentals',
  'entrepreneurship-pathway',
  'financial-literacy',
  'business-model-design',
  'business-plan-development',
  'marketing-sales',
  'digital-marketing',
  'business-growth-strategy',
  'leadership',
  'basic-mechanical-engineering'
]

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  category: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  duration_hours: number | null
  enrollment_count: number | null
  is_featured: boolean | null
  created_at?: string
}

type Enrollment = {
  course_id: string
  progress_percentage: number
  status: string
  completed_at: string | null
  enrolled_at?: string
  course: Course
}

type LearningPoint = {
  id: string
  user_id: string
  points: number
  source: string
  earned_at: string
}

type Badge = {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

type Certificate = {
  id: string
  name: string
  issued_at: string
  expiry_at: string | null
  status: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ start: '2026-02-09', end: '2026-03-11' })
  const [showFilters, setShowFilters] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalHours: 0,
    learningPoints: 1250,
    badges: 8,
    certificates: 3
  })

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Kenny Londaisha', department: 'Route To Market', points: 230 },
    { name: 'Mamabeka Map...', department: 'HO Logistics', points: 230 },
    { name: 'Thato Rasethunt...', department: 'HO Logistics', points: 230 },
    { name: 'Fatima Selai', department: 'HO Logistics', points: 230 },
    { name: 'Samuel Boakye', department: 'Engineering', points: 215 },
  ])

  // Badges data
  const [badges, setBadges] = useState([
    { id: 1, name: 'Browser-in-the-Browser Hero', description: 'Cyber Security', unlocked: true, icon: '🛡️' },
    { id: 2, name: 'Anti-Bribery Hero', description: 'Code of Conduct', unlocked: true, icon: '⚖️' },
    { id: 3, name: 'Smishing Savvy', description: 'Cyber Security', unlocked: true, icon: '📱' },
    { id: 4, name: 'Data and Information Basics', description: 'Data Literacy', unlocked: false, icon: '📊' },
  ])

  // Recent achievements
  const [recentAchievements, setRecentAchievements] = useState([
    { id: 1, name: 'Browser-in-the-Browser Hero', date: '2026-03-10', icon: '🛡️' },
    { id: 2, name: 'Anti-Bribery Hero', date: '2026-03-08', icon: '⚖️' },
    { id: 3, name: 'Smishing Savvy', date: '2026-03-05', icon: '📱' },
  ])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch approved courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .in('slug', APPROVED_COURSE_SLUGS)
        .order('is_featured', { ascending: false })
        .order('title')

      if (courses) {
        setAllCourses(courses)
        
        const uniqueCategories = Array.from(
          new Set(courses.map(c => c.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          progress_percentage,
          status,
          completed_at,
          enrolled_at,
          course:courses!inner(*)
        `)
        .eq('user_id', user.id)
        .in('course.slug', APPROVED_COURSE_SLUGS)
        .order('enrolled_at', { ascending: false })

      if (enrollmentsData) {
        const transformedEnrollments: Enrollment[] = enrollmentsData.map((item: any) => ({
          course_id: item.course_id,
          progress_percentage: item.progress_percentage,
          status: item.status,
          completed_at: item.completed_at,
          enrolled_at: item.enrolled_at,
          course: Array.isArray(item.course) ? item.course[0] : item.course
        }))
        
        setEnrollments(transformedEnrollments)

        // Calculate stats
        const completedCourses = transformedEnrollments.filter(e => e.completed_at).length
        const inProgressCourses = transformedEnrollments.filter(e => e.status === 'active' && !e.completed_at && e.progress_percentage > 0).length
        const notStartedCourses = transformedEnrollments.filter(e => e.status === 'active' && e.progress_percentage === 0).length
        
        const enrolledCourseIds = transformedEnrollments.map(e => e.course_id)
        
        let totalLessons = 0
        let completedLessons = 0
        let totalHours = 0

        if (enrolledCourseIds.length > 0) {
          const { data: modules } = await supabase
            .from('modules')
            .select('id, estimated_minutes')
            .in('course_id', enrolledCourseIds)

          if (modules) {
            totalHours = Math.round(modules.reduce((acc, m) => acc + (m.estimated_minutes || 0), 0) / 60)
            
            const moduleIds = modules.map(m => m.id)
            
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds)
              .eq('is_published', true)

            if (lessons) {
              totalLessons = lessons.length
              
              const { data: completed } = await supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('completed', true)
                .in('lesson_id', lessons.map(l => l.id))

              completedLessons = completed?.length || 0
            }
          }
        }

        setStats(prev => ({
          ...prev,
          totalEnrolled: transformedEnrollments.length,
          completedCourses,
          inProgressCourses,
          notStartedCourses,
          totalLessons,
          completedLessons,
          totalHours
        }))
      }

      setLoading(false)
    }

    loadUserData()
  }, [supabase])

  const handleEnroll = async (courseId: string, courseSlug: string) => {
    if (!user) return
    
    await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0
    })
    
    router.push(`/dashboard/learn/${courseSlug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Stratavax Learning...</p>
        </div>
      </div>
    )
  }

  const enrolledCourseIds = enrollments.map(e => e.course_id)
  
  const filteredCourses = (searchQuery
    ? allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allCourses
  ).filter(c => selectedCategory === 'all' || c.category === selectedCategory)

  const inProgressCourses = enrollments.filter(e => e.status === 'active' && !e.completed_at && e.progress_percentage > 0)
  const notStartedCourses = enrollments.filter(e => e.status === 'active' && e.progress_percentage === 0)
  const completedCoursesList = enrollments.filter(e => e.completed_at)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Microsoft 365 Style Top Bar */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <GraduationCap className="text-white" size={14} />
              </div>
              <span className="font-semibold text-sm">Stratavax Learning</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard" className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md">Home</Link>
              <Link href="/dashboard/courses" className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">Course Catalogue</Link>
              <Link href="/dashboard/progress" className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">My Training</Link>
              <Link href="/dashboard/certificates" className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">Certificates</Link>
              <Link href="/dashboard/community" className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">Community</Link>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <HelpCircle size={18} className="text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded relative">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.email?.split('@')[0]}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed left-0 top-12 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden lg:block`}>
        <div className="flex flex-col h-full">
          <div className="p-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            <Link href="/dashboard" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-blue-600 bg-blue-50`}>
              <Home size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Overview</span>}
            </Link>
            <Link href="/dashboard/courses" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <BookOpen size={20} />
              {!sidebarCollapsed && <span className="text-sm">Course Catalogue</span>}
            </Link>
            <Link href="/dashboard/training" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Target size={20} />
              {!sidebarCollapsed && <span className="text-sm">Training Plans</span>}
            </Link>
            <Link href="/dashboard/certificates" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Award size={20} />
              {!sidebarCollapsed && <span className="text-sm">Certificates</span>}
            </Link>
            <Link href="/dashboard/skills" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Star size={20} />
              {!sidebarCollapsed && <span className="text-sm">Skills</span>}
            </Link>
            <Link href="/dashboard/transcript" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <FileText size={20} />
              {!sidebarCollapsed && <span className="text-sm">Transcript</span>}
            </Link>
            <Link href="/dashboard/leaderboard" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Trophy size={20} />
              {!sidebarCollapsed && <span className="text-sm">Leaderboard</span>}
            </Link>

            <div className="border-t my-4"></div>

            <Link href="/dashboard/manager" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Users size={20} />
              {!sidebarCollapsed && <span className="text-sm">Line Manager Dashboard</span>}
            </Link>
            <Link href="/dashboard/reports" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <BarChart size={20} />
              {!sidebarCollapsed && <span className="text-sm">Reports</span>}
            </Link>
            <Link href="/dashboard/settings" className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${sidebarCollapsed ? 'justify-center' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}>
              <Settings size={20} />
              {!sidebarCollapsed && <span className="text-sm">Settings</span>}
            </Link>
          </nav>

          <div className="p-4 border-t">
            <button className={`flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-12 bottom-0 w-64 bg-white" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="p-2 space-y-1">
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-blue-50 text-blue-600">
                <Home size={20} />
                <span className="text-sm font-medium">Overview</span>
              </Link>
              <Link href="/dashboard/courses" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <BookOpen size={20} />
                <span className="text-sm">Course Catalogue</span>
              </Link>
              <Link href="/dashboard/training" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <Target size={20} />
                <span className="text-sm">Training Plans</span>
              </Link>
              <Link href="/dashboard/certificates" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <Award size={20} />
                <span className="text-sm">Certificates</span>
              </Link>
              <Link href="/dashboard/skills" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <Star size={20} />
                <span className="text-sm">Skills</span>
              </Link>
              <Link href="/dashboard/transcript" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <FileText size={20} />
                <span className="text-sm">Transcript</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-12 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header with breadcrumbs */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Stratavax Learning</span>
              <ChevronRight size={14} className="mx-1" />
              <span className="text-gray-900">Home</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">My Training Dashboard</h1>
              <div className="flex items-center space-x-3 mt-2 md:mt-0">
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-2">
                  <Download size={16} />
                  <span>Export to PDF</span>
                </button>
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-2">
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('training')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'training' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Training
              </button>
              <button 
                onClick={() => setActiveTab('certificates')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'certificates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Certificates
              </button>
              <button 
                onClick={() => setActiveTab('skills')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'skills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Skills
              </button>
              <button 
                onClick={() => setActiveTab('transcript')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'transcript' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Transcript
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded">
                      <BookOpen className="text-blue-600" size={18} />
                    </div>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalEnrolled}</h3>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-yellow-100 rounded">
                      <Clock className="text-yellow-600" size={18} />
                    </div>
                    <span className="text-xs text-gray-500">In progress</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</h3>
                  <p className="text-sm text-gray-600">Active Courses</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 rounded">
                      <CheckCircle className="text-green-600" size={18} />
                    </div>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.completedCourses}</h3>
                  <p className="text-sm text-gray-600">Completed Courses</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 rounded">
                      <Trophy className="text-purple-600" size={18} />
                    </div>
                    <span className="text-xs text-gray-500">Points</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.learningPoints}</h3>
                  <p className="text-sm text-gray-600">Learning Points</p>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Enrollments by status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Not started</span>
                        <span className="font-medium">{stats.notStartedCourses}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${stats.totalEnrolled ? (stats.notStartedCourses/stats.totalEnrolled)*100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">In progress</span>
                        <span className="font-medium">{stats.inProgressCourses}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `${stats.totalEnrolled ? (stats.inProgressCourses/stats.totalEnrolled)*100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Completed</span>
                        <span className="font-medium">{stats.completedCourses}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${stats.totalEnrolled ? (stats.completedCourses/stats.totalEnrolled)*100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Enrollments by course</h3>
                  <div className="space-y-3">
                    {enrollments.slice(0, 5).map((enrollment, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate max-w-[150px]">{enrollment.course.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          enrollment.completed_at ? 'bg-green-100 text-green-700' :
                          enrollment.progress_percentage > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {enrollment.completed_at ? 'Completed' : enrollment.progress_percentage > 0 ? 'In progress' : 'Not started'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Learning Points</h3>
                    <Link href="/dashboard/leaderboard" className="text-xs text-blue-600 hover:underline">View all</Link>
                  </div>
                  <div className="space-y-3">
                    {leaderboard.map((person, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${idx < 3 ? 'text-yellow-600' : 'text-gray-500'}`}>#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{person.name}</p>
                            <p className="text-xs text-gray-500">{person.department}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{person.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Badges */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Recent Achievements</h3>
                  <Link href="/dashboard/badges" className="text-xs text-blue-600 hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentAchievements.map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:shadow-sm transition">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xl">
                        {badge.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-500">Earned {new Date(badge.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Learning */}
              {inProgressCourses.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Continue Learning</h3>
                    <Link href="/dashboard/my-courses" className="text-xs text-blue-600 hover:underline">View all</Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressCourses.slice(0, 3).map((enrollment) => (
                      <div key={enrollment.course_id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 bg-blue-50 rounded">
                            <BookOpen className="text-blue-600" size={18} />
                          </div>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full
