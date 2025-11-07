import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { Button, Card, Input, Textarea, Modal, Alert, Badge } from '../../components/ui'

const emptyForm = { certificate_type: '', description: '' }

const CertificateTypeManagement = () => {
  const { role } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificateTypes'],
    queryFn: async () => {
      const response = await api.get('/certificates/types')
      return response.data.certificate_types || []
    },
    staleTime: 60_000,
  })

  const certificateTypes = data || []

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingType?._id) {
        return api.put(`/certificates/types/${editingType._id}`, payload)
      }
      return api.post('/certificates/types', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTypes'] })
      setIsModalOpen(false)
      setEditingType(null)
      setFormData(emptyForm)
      setActionError('')
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to save certificate type'
      setActionError(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/certificates/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTypes'] })
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to delete certificate type'
      setActionError(message)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.certificate_type.trim()) {
      setActionError('Certificate type name is required.')
      return
    }
    saveMutation.mutate({
      certificate_type: formData.certificate_type.trim(),
      description: formData.description,
    })
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      certificate_type: type.certificate_type,
      description: type.description || '',
    })
    setActionError('')
    setIsModalOpen(true)
  }

  const handleDelete = (typeId) => {
    if (window.confirm('Delete this certificate type? This cannot be undone.')) {
      deleteMutation.mutate(typeId)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="error">
          You do not have permission to manage certificate types.
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Types</h1>
          <p className="text-gray-600">Create and maintain reusable certificate templates.</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setEditingType(null); setFormData(emptyForm); setActionError('') }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Certificate Type
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          Failed to load certificate types. Please try again.
        </Alert>
      )}

      {actionError && (
        <Alert variant="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Certificate Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={4}>
                    Loading certificate types...
                  </td>
                </tr>
              )}

              {!isLoading && certificateTypes.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-gray-500" colSpan={4}>
                    No certificate types defined yet.
                  </td>
                </tr>
              )}

              {certificateTypes.map((type) => (
                <tr key={type._id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{type.certificate_type}</td>
                  <td className="px-6 py-4 text-gray-600">{type.description || '—'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={type.status === 'Active' ? 'success' : 'warning'}>
                      {type.status || 'Active'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      className="inline-flex text-blue-600 hover:text-blue-800"
                      onClick={() => handleEdit(type)}
                      title="Edit certificate type"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      className="inline-flex text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(type._id)}
                      title="Delete certificate type"
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
        title={editingType ? 'Edit Certificate Type' : 'Add Certificate Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Certificate Type"
            placeholder="e.g., Bonafide Certificate"
            value={formData.certificate_type}
            onChange={(event) => setFormData((prev) => ({ ...prev, certificate_type: event.target.value }))}
            required
          />

          <Textarea
            label="Description"
            rows={4}
            placeholder="Describe when this certificate should be used"
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
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
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingType ? 'Update Type' : 'Create Type'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CertificateTypeManagement
