import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalCourses: number
    completedCourses: number
    inProgressCourses: number
    averageProgress: number
    totalStudyTime: number
  }
}

export default function DashboardStats({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed',
      value: stats.completedCourses,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'In Progress',
      value: stats.inProgressCourses,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Study Hours',
      value: `${stats.totalStudyTime}h`,
      icon: Clock,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
            
            {/* Progress bar for average progress on first card */}
            {card.title === 'Total Courses' && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Average Progress</span>
                  <span>{stats.averageProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.averageProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
