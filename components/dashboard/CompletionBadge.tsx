'use client'

import { Trophy, Star, Zap, Award, Crown } from 'lucide-react'

interface BadgeProps {
  type: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'
  courseCount: number
  onShare?: () => void
}

export default function CompletionBadge({ type, courseCount, onShare }: BadgeProps) {
  const badges = {
    beginner: {
      name: 'Learning Enthusiast',
      icon: Star,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      requirement: 'Complete 1 course'
    },
    intermediate: {
      name: 'Skill Builder',
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      requirement: 'Complete 3 courses'
    },
    advanced: {
      name: 'Advanced Learner',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      requirement: 'Complete 5 courses'
    },
    expert: {
      name: 'Subject Matter Expert',
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      requirement: 'Complete 10 courses'
    },
    master: {
      name: 'Master Learner',
      icon: Crown,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      requirement: 'Complete 15+ courses'
    }
  }

  const badge = badges[type]
  const Icon = badge.icon
  const isAchieved = courseCount >= (type === 'beginner' ? 1 : type === 'intermediate' ? 3 : type === 'advanced' ? 5 : type === 'expert' ? 10 : 15)

  return (
    <div className={`rounded-xl p-4 ${badge.bg} ${isAchieved ? 'opacity-100' : 'opacity-50 grayscale'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${badge.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${badge.color}`}>{badge.name}</h3>
          <p className="text-xs text-gray-600">{badge.requirement}</p>
          {isAchieved && (
            <p className="text-xs text-green-600 mt-1">✓ Achieved!</p>
          )}
        </div>
        {isAchieved && (
          <button
            onClick={onShare}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Share
          </button>
        )}
      </div>
    </div>
  )
}
