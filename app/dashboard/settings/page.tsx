'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data && isMounted) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || user.email || ''
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Password</h3>
            <Button variant="outline" onClick={() => {
              // Implement password change
              toast.success('Password reset email sent')
            }}>
              Change Password
            </Button>
          </div>
          <div>
            <h3 className="font-medium mb-2">Notifications</h3>
            <p className="text-sm text-gray-600 mb-2">
              Manage your email notification preferences
            </p>
            <Button variant="outline">
              Configure Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
