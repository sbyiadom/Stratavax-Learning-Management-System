import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check if user is admin (you may want to add role checking)
  // For now, just show the admin dashboard
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/assignments" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Assignments</h2>
            <p className="text-gray-600">Manage and grade assignments</p>
          </Link>
          
          <Link href="/admin/courses" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Courses</h2>
            <p className="text-gray-600">Manage courses and content</p>
          </Link>
          
          <Link href="/admin/users" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-gray-600">Manage users and roles</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
