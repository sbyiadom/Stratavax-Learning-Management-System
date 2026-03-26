'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, ChevronRight, ChevronLeft, Home, LogOut, Menu, X, Download, Upload, FileSpreadsheet, Plus, Trash2, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface TrainingRecord {
  id: string
  training_date: string
  attendee_name: string
  course: string
  facilitator: string
  supervisor: string
  department: string
  duration_hours: number
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await loadData()
      setLoading(false)
    }
    loadUser()
  }, [])

  const loadData = async () => {
    const { data, error } = await supabase
      .from('training_records')
      .select('*')
      .order('training_date', { ascending: false })
    
    if (!error && data) {
      setRecords(data)
    }
  }

  const handleAddRow = () => {
    const newRow: TrainingRecord = {
      id: `temp-${Date.now()}`,
      training_date: new Date().toISOString().split('T')[0],
      attendee_name: '',
      course: '',
      facilitator: '',
      supervisor: '',
      department: '',
      duration_hours: 0
    }
    setRecords([newRow, ...records])
  }

  const handleDeleteRow = async (id: string) => {
    if (id.startsWith('temp-')) {
      setRecords(records.filter(r => r.id !== id))
      setMessage({ type: 'success', text: 'Row removed' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    const { error } = await supabase
      .from('training_records')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setRecords(records.filter(r => r.id !== id))
      setMessage({ type: 'success', text: 'Record deleted' })
    } else {
      setMessage({ type: 'error', text: 'Failed to delete' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdateField = (id: string, field: keyof TrainingRecord, value: any) => {
    setRecords(records.map(record => 
      record.id === id ? { ...record, [field]: value } : record
    ))
  }

  const saveChanges = async () => {
    setSaving(true)
    setMessage(null)
    
    const newRecords = records.filter(r => r.id.startsWith('temp-'))
    const existingRecords = records.filter(r => !r.id.startsWith('temp-'))
    
    let successCount = 0
    let errorCount = 0
    
    for (const record of newRecords) {
      const { error } = await supabase
        .from('training_records')
        .insert({
          training_date: record.training_date,
          attendee_name: record.attendee_name,
          course: record.course,
          facilitator: record.facilitator,
          supervisor: record.supervisor,
          department: record.department,
          duration_hours: record.duration_hours
        })
      
      if (!error) successCount++
      else errorCount++
    }
    
    for (const record of existingRecords) {
      const { error } = await supabase
        .from('training_records')
        .update({
          training_date: record.training_date,
          attendee_name: record.attendee_name,
          course: record.course,
          facilitator: record.facilitator,
          supervisor: record.supervisor,
          department: record.department,
          duration_hours: record.duration_hours
        })
        .eq('id', record.id)
      
      if (!error) successCount++
      else errorCount++
    }
    
    if (errorCount === 0) {
      setMessage({ type: 'success', text: `Saved ${successCount} record(s) successfully` })
      await loadData()
    } else {
      setMessage({ type: 'error', text: `Saved ${successCount} records, ${errorCount} failed` })
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const downloadTemplate = () => {
    const template = [{
      'Training Date': new Date().toISOString().split('T')[0],
      'Attendee Name': 'John Doe',
      'Course': 'Sample Course',
      'Facilitator': 'Dr. Smith',
      'Supervisor': 'Jane Manager',
      'Department': 'HR',
      'Duration Hours': 4
    }]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, 'training-template.xlsx')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      setImportData(jsonData)
      setImportPreview(jsonData.slice(0, 5))
      setShowImportModal(true)
    }
    reader.readAsBinaryString(file)
  }

  const confirmImport = async () => {
    if (importData.length === 0) return
    
    setSaving(true)
    let successCount = 0
    
    for (const row of importData) {
      const newRecord = {
        training_date: row['Training Date'] || row['training_date'] || new Date().toISOString().split('T')[0],
        attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || '',
        course: row['Course'] || row['course'] || '',
        facilitator: row['Facilitator'] || row['facilitator'] || '',
        supervisor: row['Supervisor'] || row['supervisor'] || '',
        department: row['Department'] || row['department'] || '',
        duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0)
      }
      
      const { error } = await supabase
        .from('training_records')
        .insert(newRecord)
      
      if (!error) successCount++
    }
    
    await loadData()
    setMessage({ type: 'success', text: `Imported ${successCount} records` })
    setShowImportModal(false)
    setImportData([])
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const exportToExcel = () => {
    const exportData = records.map(record => ({
      'Training Date': record.training_date,
      'Attendee Name': record.attendee_name,
      'Course': record.course,
      'Facilitator': record.facilitator,
      'Supervisor': record.supervisor,
      'Department': record.department,
      'Duration Hours': record.duration_hours
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Records')
    XLSX.writeFile(workbook, `training-data-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="font-semibold">Stratavax Admin</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={downloadTemplate} className="p-2 hover:bg-gray-100 rounded" title="Download Template">
              <Download size={18} className="text-gray-600" />
            </button>
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-100 rounded" title="Import Excel">
              <Upload size={18} className="text-gray-600" />
            </button>
            <button onClick={exportToExcel} className="p-2 hover:bg-gray-100 rounded" title="Export Data">
              <Download size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm hidden md:block">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-14 bottom-0 bg-white border-r transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:block`}>
        <div className="p-4 flex justify-end">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded">
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="px-3 space-y-1">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
            <Home size={20} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
          <Link href="/admin/reports" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-blue-50 text-blue-600">
            <BarChart3 size={20} /> {!sidebarCollapsed && <span>Training Records</span>}
          </Link>
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleSignOut} className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
            <LogOut size={20} /> {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-14 bottom-0 w-64 bg-white">
            <div className="p-4 border-b flex justify-between">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="p-3 space-y-1">
              <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                <Home size={20} /><span>Dashboard</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6">
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span>Admin</span>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-gray-900">Training Records</span>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-green-600" />
                  <span className="font-medium">Training Records Editor</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleAddRow} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={16} /> Add Row
                  </button>
                  <button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Save
                  </button>
                </div>
              </div>
              {message && (
                <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">💡 Tip: Add rows, edit cells, then click Save to sync with database.</div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Attendee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Facilitator</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Supervisor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No records. Click "Add Row" to create one.
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input type="date" value={record.training_date} onChange={(e) => handleUpdateField(record.id, 'training_date', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={record.attendee_name} onChange={(e) => handleUpdateField(record.id, 'attendee_name', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Name" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={record.course} onChange={(e) => handleUpdateField(record.id, 'course', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Course" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={record.facilitator} onChange={(e) => handleUpdateField(record.id, 'facilitator', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Facilitator" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={record.supervisor || ''} onChange={(e) => handleUpdateField(record.id, 'supervisor', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Supervisor" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={record.department} onChange={(e) => handleUpdateField(record.id, 'department', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Dept" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.5" value={record.duration_hours} onChange={(e) => handleUpdateField(record.id, 'duration_hours', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => handleDeleteRow(record.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>Total: {records.length} records</span>
              <span>✓ Click Save to commit changes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Import Excel Data</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4">
              {importPreview.length > 0 && (
                <div>
                  <p className="text-sm mb-3">Preview of {importData.length} records:</p>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(importPreview[0]).slice(0, 5).map(key => (
                            <th key={key} className="px-3 py-2 border">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).slice(0, 5).map((value: any, i) => (
                              <td key={i} className="px-3 py-2 border">{String(value).slice(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Import {importData.length} Records</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
