import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import { Button, Card, Badge, Alert, Modal, Select } from '../../components/ui'
import { NOTICE_TYPES, NOTICE_STATUSES } from './constants'
import { fetchNotices, deleteNotice, updateNotice } from './noticeApi'
import { formatDateTime, capitalize } from '../../lib/utils'

const NoticeAdminList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuthStore()

  const [filters, setFilters] = useState({ type: 'all', status: 'all' })
  const [noticeToDelete, setNoticeToDelete] = useState(null)
  const [actionError, setActionError] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['notices', 'admin', filters],
    queryFn: () =>
      fetchNotices({
        include_drafts: true,
        include_inactive: true,
        ...(filters.type !== 'all' ? { type: filters.type } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
      }),
  })

  const notices = data?.notices || []

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      refetch()
      setNoticeToDelete(null)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to delete notice'
      setActionError(message)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNotice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      refetch()
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to update notice'
      setActionError(message)
    },
  })

  if (role !== 'admin' && role !== 'staff') {
    return (
      <Alert variant="error">
        You do not have permission to manage notices.
      </Alert>
    )
  }

  const handleFilterChange = (field) => (value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleStatus = (notice) => {
    const nextStatus = notice.status === 'published' ? 'draft' : 'published'
    updateStatusMutation.mutate({ id: notice.id, payload: { status: nextStatus } })
  }

  const handleToggleFeatured = (notice) => {
    updateStatusMutation.mutate({ id: notice.id, payload: { is_featured: !notice.is_featured } })
  }

  const confirmDelete = () => {
    if (noticeToDelete) {
      deleteMutation.mutate(noticeToDelete.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Notices</h1>
          <p className="text-gray-600">
            Create, publish, and organize announcements for students and staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFetching && <span className="text-sm text-gray-500">Refreshing…</span>}
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/notices/new')}>
            New Notice
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="error">
          {actionError}
        </Alert>
      )}

      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <Select
              label="Filter by Type"
              placeholder="All types"
              options={[{ value: 'all', label: 'All Types' }, ...NOTICE_TYPES]}
              value={filters.type}
              onChange={(event) => handleFilterChange('type')(event.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <Select
              label="Filter by Status"
              placeholder="All statuses"
              options={[{ value: 'all', label: 'All Statuses' }, ...NOTICE_STATUSES]}
              value={filters.status}
              onChange={(event) => handleFilterChange('status')(event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                  Loading notices...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-red-600">
                  Failed to load notices. Please try again later.
                </td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                  No notices found. Create a new notice to get started.
                </td>
              </tr>
            ) : (
              notices.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{notice.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{notice.summary}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="primary">{capitalize(notice.type)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={notice.status === 'published' ? 'success' : 'secondary'}>
                      {capitalize(notice.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 space-y-1">
                    <p>Start: {formatDateTime(notice.publish_start) || '—'}</p>
                    <p>End: {notice.publish_end ? formatDateTime(notice.publish_end) : '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {notice.is_featured ? (
                      <Badge variant="success">Featured</Badge>
                    ) : (
                      <Badge variant="default">Standard</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/notices/${notice.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(notice)}
                        loading={updateStatusMutation.isPending}
                      >
                        {notice.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        size="sm"
                        variant={notice.is_featured ? 'outline' : 'primary'}
                        onClick={() => handleToggleFeatured(notice)}
                        loading={updateStatusMutation.isPending}
                      >
                        {notice.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setNoticeToDelete(notice)}
                        loading={deleteMutation.isPending && noticeToDelete?.id === notice.id}
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
        isOpen={!!noticeToDelete}
        onClose={() => setNoticeToDelete(null)}
        title="Delete Notice"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNoticeToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{noticeToDelete?.title}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default NoticeAdminList
