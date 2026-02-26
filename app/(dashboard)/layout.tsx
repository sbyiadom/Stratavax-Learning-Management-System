import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/Header'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Optional: Fetch user profile data (remove if not needed in layout)
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', session.user.id)
  //   .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed: removed profile prop since HeaderProps doesn't have it */}
      <DashboardHeader user={session.user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
