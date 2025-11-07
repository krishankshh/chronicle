import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download } from 'lucide-react'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { Button, Card, Select, Input, Textarea, Modal, Alert, Badge } from '../../components/ui'

const defaultFilters = { student_id: '', certificate_type_id: '' }
const createDefaultForm = () => ({
  student_id: '',
  certificate_type_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  remarks: '',
})

const CertificateManagement = () => {
  const { role } = useAuthStore()
  const [filters, setFilters] = useState(defaultFilters)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState(createDefaultForm())
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()

  const { data: typesData } = useQuery({
    queryKey: ['certificateTypes'],
    queryFn: async () => {
      const response = await api.get('/certificates/types')
      return response.data.certificate_types || []
    },
  })
  const certificateTypes = typesData || []

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'certificate'],
    queryFn: async () => {
      const response = await api.get('/students', { params: { limit: 500, status: 'Active' } })
      return response.data.students || []
    },
  })
  const students = studentsData || []

  const { data: certificatesData, isLoading, error } = useQuery({
    queryKey: ['certificates', filters],
    queryFn: async () => {
      const params = {}
      if (filters.student_id) params.student_id = filters.student_id
      if (filters.certificate_type_id) params.certificate_type_id = filters.certificate_type_id
      const response = await api.get('/certificates', { params })
      return response.data.certificates || []
    },
  })
  const certificates = certificatesData || []

  const issueMutation = useMutation({
    mutationFn: async (payload) => api.post('/certificates', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      setIsModalOpen(false)
      setFormData(createDefaultForm())
      setActionError('')
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to issue certificate'
      setActionError(message)
    },
  })

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id || student._id,
        label: `${student.name} (${student.roll_no})`,
      })),
    [students]
  )

  const typeOptions = useMemo(
    () =>
      certificateTypes.map((type) => ({
        value: type._id,
        label: type.certificate_type,
      })),
    [certificateTypes]
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.student_id || !formData.certificate_type_id) {
      setActionError('Please select both student and certificate type.')
      return
    }
    issueMutation.mutate(formData)
  }

  const formatDate = (value) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString()
  }

  if (role !== 'admin' && role !== 'staff') {
    return (
      <div className="p-6">
        <Alert variant="error">
          You do not have permission to manage certificates.
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600">Issue certificates and review the history of issued documents.</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setFormData(createDefaultForm()); setActionError('') }}>
          <Plus className="w-4 h-4 mr-2" />
          Issue Certificate
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          Failed to load certificates. Please try again.
        </Alert>
      )}

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Filter by Student"
            placeholder="All students"
            value={filters.student_id}
            options={studentOptions}
            onChange={(event) => setFilters((prev) => ({ ...prev, student_id: event.target.value }))}
          />
          <Select
            label="Filter by Certificate Type"
            placeholder="All certificate types"
            value={filters.certificate_type_id}
            options={typeOptions}
            onChange={(event) => setFilters((prev) => ({ ...prev, certificate_type_id: event.target.value }))}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Certificate Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issue Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={6}>
                    Loading certificates...
                  </td>
                </tr>
              )}

              {!isLoading && certificates.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    No certificates issued yet.
                  </td>
                </tr>
              )}

              {certificates.map((cert) => (
                <tr key={cert._id}>
                  <td className="px-4 py-4 font-medium text-gray-900">{cert.student_name || '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{cert.roll_no || '—'}</td>
                  <td className="px-4 py-4 text-gray-900">{cert.certificate_type_name || '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{formatDate(cert.issue_date)}</td>
                  <td className="px-4 py-4">
                    <Badge variant={cert.status === 'Active' ? 'success' : 'warning'}>
                      {cert.status || 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!cert.certificate_file}
                      title={cert.certificate_file ? 'Download certificate' : 'No file available'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Certificate"
      >
        {actionError && (
          <Alert variant="error" className="mb-4" onClose={() => setActionError('')}>
            {actionError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Student"
            placeholder="Select student"
            value={formData.student_id}
            options={studentOptions}
            onChange={(event) => setFormData((prev) => ({ ...prev, student_id: event.target.value }))}
            required
          />

          <Select
            label="Certificate Type"
            placeholder="Select certificate type"
            value={formData.certificate_type_id}
            options={typeOptions}
            onChange={(event) => setFormData((prev) => ({ ...prev, certificate_type_id: event.target.value }))}
            required
          />

          <Input
            type="date"
            label="Issue Date"
            value={formData.issue_date}
            onChange={(event) => setFormData((prev) => ({ ...prev, issue_date: event.target.value }))}
            required
          />

          <Textarea
            label="Remarks"
            rows={4}
            placeholder="Optional remarks or notes"
            value={formData.remarks}
            onChange={(event) => setFormData((prev) => ({ ...prev, remarks: event.target.value }))}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setActionError('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={issueMutation.isLoading}>
              Issue Certificate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CertificateManagement
