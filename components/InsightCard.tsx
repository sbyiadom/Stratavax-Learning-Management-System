'use client'

import { useState } from 'react'
import { Lightbulb, Sparkles, X } from 'lucide-react'

const tips = [
  "Complete one module at a time for better retention",
  "Review completed materials to reinforce understanding",
  "Take structured notes during course sessions",
  "Consistent practice yields the best results",
  "Set aside 30 minutes daily for focused learning",
  "Engage with discussion forums to deepen understanding",
  "Apply learnings to real-world scenarios",
  "Track your progress to stay motivated",
  "Break complex topics into smaller chunks",
  "Teach what you learn to reinforce knowledge",
]

export default function InsightCard() {
  const [currentTip, setCurrentTip] = useState(tips[Math.floor(Math.random() * tips.length)])
  const [dismissed, setDismissed] = useState(false)

  const refreshTip = () => {
    const newTips = tips.filter(tip => tip !== currentTip)
    const newTip = newTips[Math.floor(Math.random() * newTips.length)]
    setCurrentTip(newTip)
  }

  if (dismissed) {
    return null
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 relative group">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition opacity-0 group-hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="text-blue-600" size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Learning Insight</span>
            <span className="text-xs text-gray-400">Daily tip</span>
          </div>
          <p className="text-gray-700 leading-relaxed">{currentTip}</p>
          <button 
            onClick={refreshTip}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <Sparkles size={12} />
            Get another insight
          </button>
        </div>
      </div>
    </div>
  )
}
