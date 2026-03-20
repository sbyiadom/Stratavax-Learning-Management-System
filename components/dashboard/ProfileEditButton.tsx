'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Edit, X, Save } from 'lucide-react'

interface ProfileEditButtonProps {
  profile: any
}

export default function ProfileEditButton({ profile }: ProfileEditButtonProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile?.id,
        full_name: fullName,
        bio: bio,
        updated_at: new Date().toISOString()
      })

    if (!error) {
      setIsEditing(false)
    }
    
    setLoading(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full p-2 border rounded-lg"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          rows={3}
          className="w-full p-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
    >
      <Edit size={16} />
      Edit Profile
    </button>
  )
}
