'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, AlertCircle, Users, Filter } from 'lucide-react'

export default function AdminAssignmentsPage() {
  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    graded: 0,
    passed: 0,
    failed: 0
  })

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('user_assignments')
      .select(`
        *,
        user_profiles!inner(full_name, email, department),
        assignments!inner(title, course_id, points, passing_score)
      `)
      .order('submitted_at', { ascending: false })

    if (data) {
      setSubmissions(data)
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(s => s.status === 'submitted').length,
        graded: data.filter(s => s.status === 'graded').length,
        passed: data.filter(s => s.status === 'passed').length,
        failed: data.filter(s => s.status === 'failed').length
      })
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return s.status === 'submitted'
    if (filter === 'graded') return ['passed', 'failed'].includes(s.status)
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Assignment Submissions</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-yellow-700">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-blue-700">Graded</p>
            <p className="text-2xl font-bold text-blue-700">{stats.graded}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-700">Passed</p>
            <p className="text-2xl font-bold text-green-700">{stats.passed}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-red-700">Failed</p>
            <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-gray-400" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('graded')}
              className={`px-3 py-1.5 rounded text-sm ${filter === 'graded' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Graded
            </button>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubmissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{sub.user_profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{sub.user_profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{sub.assignments?.title}</p>
                    <p className="text-xs text-gray-500">Points: {sub.assignments?.points}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sub.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                      sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                      sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub.grade ? (
                      <span className={`font-medium ${
                        sub.grade >= sub.assignments?.passing_score ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sub.grade}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/assignments/grade/${sub.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {sub.status === 'submitted' ? 'Grade' : 'Review'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
