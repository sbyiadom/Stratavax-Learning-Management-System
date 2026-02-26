'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageCircle, Calendar } from 'lucide-react'

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Community</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Study Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Join study groups to learn with peers. Connect with fellow students taking the same courses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Discussions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Participate in course discussions. Ask questions and share knowledge with the community.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Upcoming webinars, workshops, and live sessions. Stay tuned for community events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
