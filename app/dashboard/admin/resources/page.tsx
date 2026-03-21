'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Code, 
  Trash2, 
  Edit,
  Eye,
  Upload,
  X
} from 'lucide-react'

type Resource = {
  id: string
  course_id: string
  title: string
  description: string
  resource_type: 'html' | 'pdf' | 'video' | 'link'
  content_url: string
  file_path: string
  is_published: boolean
  created_at: string
  courses?: {
    title: string
    slug: string
  }
}

type Course = {
  id: string
  title: string
  slug: string
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceType, setResourceType] = useState<'html' | 'pdf' | 'video' | 'link'>('html')
  const [resourceUrl, setResourceUrl] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Check if user is admin (you can add this check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Load courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_published', true)
      .order('title')

    if (coursesData) setCourses(coursesData)

    // Load resources with course info
    const { data: resourcesData } = await supabase
      .from('resources')
      .select(`
        *,
        courses!inner (
          title,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (resourcesData) setResources(resourcesData as Resource[])
    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `resources/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error uploading file: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    setResourceUrl(publicUrl)
    setUploading(false)
  }

  const saveResource = async () => {
    if (!selectedCourse || !resourceTitle) {
      alert('Please select a course and enter a title')
      return
    }

    const resourceData = {
      course_id: selectedCourse,
      title: resourceTitle,
      description: resourceDescription,
      resource_type: resourceType,
      content_url: resourceType === 'html' ? htmlContent : resourceUrl,
      is_published: true
    }

    if (editingId) {
      // Update existing
      await supabase
        .from('resources')
        .update(resourceData)
        .eq('id', editingId)
    } else {
      // Create new
      await supabase
        .from('resources')
        .insert([resourceData])
    }

    // Reset form
    setSelectedCourse('')
    setResourceTitle('')
    setResourceDescription('')
    setResourceType('html')
    setResourceUrl('')
    setHtmlContent('')
    setEditingId(null)
    setShowAddModal(false)
    
    // Reload data
    loadData()
  }

  const deleteResource = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await supabase
        .from('resources')
        .delete()
        .eq('id', id)
      loadData()
    }
  }

  const editResource = (resource: Resource) => {
    setEditingId(resource.id)
    setSelectedCourse(resource.course_id)
    setResourceTitle(resource.title)
    setResourceDescription(resource.description || '')
    setResourceType(resource.resource_type)
    if (resource.resource_type === 'html') {
      setHtmlContent(resource.content_url || '')
    } else {
      setResourceUrl(resource.content_url || '')
    }
    setShowAddModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin - Course Resources</h1>
            <button
              onClick={() => {
                setEditingId(null)
                setSelectedCourse('')
                setResourceTitle('')
                setResourceDescription('')
                setResourceType('html')
                setResourceUrl('')
                setHtmlContent('')
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {resource.resource_type === 'html' && <Code className="text-blue-500 mr-3" size={20} />}
                        {resource.resource_type === 'pdf' && <FileText className="text-red-500 mr-3" size={20} />}
                        {resource.resource_type === 'video' && <Video className="text-green-500 mr-3" size={20} />}
                        {resource.resource_type === 'link' && <LinkIcon className="text-purple-500 mr-3" size={20} />}
                        <div>
                          <div className="font-medium text-gray-900">{resource.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {resource.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {resource.courses?.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 uppercase">
                        {resource.resource_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        resource.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {resource.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => window.open(`/resources/${resource.id}`, '_blank')}
                        className="text-gray-400 hover:text-gray-600 mr-3"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => editResource(resource)}
                        className="text-blue-400 hover:text-blue-600 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteResource(resource.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {resources.length === 0 && (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600">Click "Add Resource" to create your first learning resource.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Edit Resource' : 'Add New Resource'}
                </h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
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

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lubrication Interactive Module"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this resource..."
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Type
                </label>
                <div className="grid grid-cols-4 gap-4">
                  <button
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

              {/* Content Input */}
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
                  />
                </div>
              )}

              {(resourceType === 'pdf' || resourceType === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept={resourceType === 'pdf' ? '.pdf' : '.mp4,.webm'}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Upload size={20} />
                      Choose File
                    </label>
                    {uploading && <p className="mt-2 text-sm text-gray-600">Uploading...</p>}
                    {resourceUrl && (
                      <p className="mt-2 text-sm text-green-600">File uploaded successfully!</p>
                    )}
                  </div>
                </div>
              )}

              {resourceType === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/resource"
                  />
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveResource}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update Resource' : 'Save Resource'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
