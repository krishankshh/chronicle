import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { Alert, Badge, Button, Card, Modal, Select, Input } from '../../components/ui'
import { fetchMaterials, deleteMaterial } from './materialsApi'
import { formatDateTime } from '../../lib/utils'

const MaterialAdminList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuthStore()

  const [filters, setFilters] = useState({
    courseId: 'all',
    semester: '',
    search: '',
  })
  const [materialToDelete, setMaterialToDelete] = useState(null)
  const [actionError, setActionError] = useState('')

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'material-admin'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const coursesOptions = useMemo(
    () =>
      [{ value: 'all', label: 'All courses' }].concat(
        (coursesData || []).map((course) => ({
          value: course._id,
          label: course.course_name || course.course_code || 'Course',
        }))
      ),
    [coursesData]
  )

  const materialsQuery = useQuery({
    queryKey: ['materials', 'admin', filters],
    queryFn: () =>
      fetchMaterials({
        page: 1,
        limit: 50,
        include_inactive: true,
        include_drafts: true,
        ...(filters.courseId !== 'all' ? { course_id: filters.courseId } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['materials', 'admin'] })
      setMaterialToDelete(null)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to delete material.'
      setActionError(message)
    },
  })

  if (!['staff', 'admin'].includes(role)) {
    return (
      <Alert variant="error">
        You do not have permission to manage study materials.
      </Alert>
    )
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const materials = materialsQuery.data?.materials || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Study Materials</h1>
          <p className="text-gray-600">Upload resources, attach documents, and keep students up to date.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => materialsQuery.refetch()}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/materials/new')}>New material</Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            label="Course"
            value={filters.courseId}
            onChange={(event) => handleFilterChange('courseId', event.target.value || 'all')}
            options={coursesOptions}
          />
          <Input
            label="Semester"
            type="number"
            min={1}
            value={filters.semester}
            onChange={(event) => handleFilterChange('semester', event.target.value)}
            placeholder="e.g. 3"
          />
          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => handleFilterChange('search', event.target.value)}
            placeholder="Search title or description"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Semester
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Files
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {materialsQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  Loading materials...
                </td>
              </tr>
            ) : materialsQuery.error ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-600">
                  Failed to load study materials.
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No study materials found. Start by creating one.
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{material.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {material.description?.replace(/<[^>]+>/g, '') || 'No description'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {material.course_id ? (
                      <Badge variant="outline">Course #{material.course_id.slice(-6)}</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {material.semester ? `Semester ${material.semester}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {material.attachments?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(material.updated_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/materials/${material.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setMaterialToDelete(material)}
                        loading={deleteMutation.isPending && materialToDelete?.id === material.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={!!materialToDelete}
        onClose={() => setMaterialToDelete(null)}
        title="Delete study material"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMaterialToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(materialToDelete.id)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete <span className="font-semibold">{materialToDelete?.title}</span>? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default MaterialAdminList
