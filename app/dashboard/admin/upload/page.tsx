'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Video, Link as LinkIcon, Code } from 'lucide-react'

export default function AdminUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [resourceType, setResourceType] = useState<'html' | 'pdf' | 'video' | 'link'>('html')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  
  const router = useRouter()

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_published', true)
        .order('title')
      if (data) setCourses(data)
    }
    loadCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      if (resourceType === 'html') {
        // Save HTML content directly
        const { error } = await supabase
          .from('resources')
          .insert({
            course_id: selectedCourse,
            title,
            description,
            resource_type: 'html',
            content_url: htmlContent,
            is_published: true
          })

        if (error) throw error
      }

      // Redirect back to resources
      router.push('/dashboard/admin/resources')
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload resource')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/admin/resources"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Resources</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Upload New Resource</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Type
              </label>
              <div className="grid grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setResourceType('html')}
                  className={`p-4 border rounded-lg text-center transition ${
                    resourceType === 'html' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Code size={24} className="mx-auto mb-2" />
                  <span className="text-sm">HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('pdf')}
                  className={`p-4 border rounded-lg text-center transition ${
                    resourceType === 'pdf' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText size={24} className="mx-auto mb-2" />
                  <span className="text-sm">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('video')}
                  className={`p-4 border rounded-lg text-center transition ${
                    resourceType === 'video' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Video size={24} className="mx-auto mb-2" />
                  <span className="text-sm">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('link')}
                  className={`p-4 border rounded-lg text-center transition ${
                    resourceType === 'link' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <LinkIcon size={24} className="mx-auto mb-2" />
                  <span className="text-sm">Link</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Interactive Lubrication Module"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this resource..."
              />
            </div>

            {/* Content based on type */}
            {resourceType === 'html' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste your HTML code here..."
                  required
                />
              </div>
            )}

            {resourceType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter YouTube or video URL
                </p>
              </div>
            )}

            {resourceType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/resource"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/dashboard/admin/resources"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Upload Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
