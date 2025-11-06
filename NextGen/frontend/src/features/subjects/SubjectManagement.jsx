/**
 * Subject Management Page - Staff/Admin view to manage subjects
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Button, Alert, Badge, Modal, Input, Select, Textarea, Pagination } from '../../components/ui';
import SearchFilter from '../../components/SearchFilter';

// Validation schema
const subjectSchema = z.object({
  subject_name: z.string().min(1, 'Subject name is required'),
  subject_code: z.string().min(1, 'Subject code is required'),
  course_id: z.string().min(1, 'Course is required'),
  semester: z.number().min(1).max(12, 'Semester must be between 1 and 12'),
  subject_type: z.enum(['Theory', 'Practical', 'Lab', 'Project'], { required_error: 'Subject type is required' }),
  credits: z.number().min(1).max(10, 'Credits must be between 1 and 10'),
  description: z.string().optional(),
});

const SubjectManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const queryClient = useQueryClient();

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['courses-all'],
    queryFn: async () => {
      const response = await api.get('/courses?limit=100&status=Active');
      return response.data;
    },
  });

  // Fetch subjects
  const { data: subjectsData, isLoading, error } = useQuery({
    queryKey: ['subjects', page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        include_course: 'true',
        ...(search && { search }),
        ...(filters.course_id && { course_id: filters.course_id }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.subject_type && { subject_type: filters.subject_type }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await api.get(`/subjects?${params}`);
      return response.data;
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(subjectSchema),
    values: editingSubject ? {
      subject_name: editingSubject.subject_name || '',
      subject_code: editingSubject.subject_code || '',
      course_id: editingSubject.course_id || '',
      semester: editingSubject.semester || 1,
      subject_type: editingSubject.subject_type || 'Theory',
      credits: editingSubject.credits || 3,
      description: editingSubject.description || '',
    } : undefined,
  });

  const selectedCourseId = watch('course_id');
  const selectedCourse = coursesData?.courses?.find(c => c._id === selectedCourseId);

  // Create mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/subjects', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowCreateModal(false);
      reset();
    },
  });

  // Update mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/subjects/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setEditingSubject(null);
      reset();
    },
  });

  // Delete mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDeletingSubject(null);
    },
  });

  const onSubmit = (data) => {
    const subjectData = {
      ...data,
      semester: parseInt(data.semester),
      credits: parseInt(data.credits),
    };

    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject._id, data: subjectData });
    } else {
      createSubjectMutation.mutate(subjectData);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    reset();
  };

  const handleDelete = (subject) => {
    setDeletingSubject(subject);
  };

  const confirmDelete = () => {
    if (deletingSubject) {
      deleteSubjectMutation.mutate(deletingSubject._id);
    }
  };

  const filterOptions = [
    {
      name: 'course_id',
      label: 'Course',
      placeholder: 'All Courses',
      options: coursesData?.courses?.map(c => ({
        value: c._id,
        label: `${c.course_code} - ${c.course_name}`
      })) || [],
    },
    {
      name: 'semester',
      label: 'Semester',
      placeholder: 'All Semesters',
      options: Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Semester ${i + 1}`,
      })),
    },
    {
      name: 'subject_type',
      label: 'Type',
      placeholder: 'All Types',
      options: [
        { value: 'Theory', label: 'Theory' },
        { value: 'Practical', label: 'Practical' },
        { value: 'Lab', label: 'Lab' },
        { value: 'Project', label: 'Project' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      placeholder: 'All Statuses',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
            <p className="text-gray-500 mt-1">Manage subjects across all courses and semesters</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Add New Subject
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search by subject name or code..."
          onSearch={setSearch}
          onFilterChange={setFilters}
          filters={filterOptions}
        />

        {/* Subjects Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading subjects...</p>
            </div>
          ) : error ? (
            <Alert variant="error">
              Failed to load subjects: {error.response?.data?.message || error.message}
            </Alert>
          ) : subjectsData?.subjects?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No subjects found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type / Credits
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
                    {subjectsData?.subjects?.map((subject) => (
                      <tr key={subject._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.subject_name}</div>
                            {subject.description && (
                              <div className="text-sm text-gray-500 max-w-md truncate">{subject.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {subject.subject_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.course ? subject.course.course_code : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Semester {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              subject.subject_type === 'Theory' ? 'info' :
                              subject.subject_type === 'Lab' ? 'warning' :
                              subject.subject_type === 'Practical' ? 'primary' : 'default'
                            }>
                              {subject.subject_type}
                            </Badge>
                            <span className="text-sm text-gray-600">{subject.credits} credits</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={subject.status === 'Active' ? 'success' : 'default'}>
                            {subject.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(subject)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(subject)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {subjectsData?.pagination && (
                <div className="mt-4">
                  <Pagination
                    currentPage={subjectsData.pagination.page}
                    totalPages={subjectsData.pagination.pages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editingSubject}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSubject(null);
          reset();
        }}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingSubject(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
            >
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(createSubjectMutation.error || updateSubjectMutation.error) && (
            <Alert variant="error">
              {createSubjectMutation.error?.response?.data?.message ||
                updateSubjectMutation.error?.response?.data?.message ||
                'Operation failed'}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Subject Name"
              {...register('subject_name')}
              error={errors.subject_name?.message}
              required
              placeholder="e.g., Data Structures"
            />

            <Input
              label="Subject Code"
              {...register('subject_code')}
              error={errors.subject_code?.message}
              required
              placeholder="e.g., CS201"
            />

            <Select
              label="Course"
              {...register('course_id')}
              error={errors.course_id?.message}
              required
              options={coursesData?.courses?.map(c => ({
                value: c._id,
                label: `${c.course_code} - ${c.course_name}`
              })) || []}
            />

            <Select
              label="Semester"
              {...register('semester', { valueAsNumber: true })}
              error={errors.semester?.message}
              required
              options={Array.from({ length: selectedCourse?.total_semesters || 10 }, (_, i) => ({
                value: i + 1,
                label: `Semester ${i + 1}`,
              }))}
            />

            <Select
              label="Subject Type"
              {...register('subject_type')}
              error={errors.subject_type?.message}
              required
              options={[
                { value: 'Theory', label: 'Theory' },
                { value: 'Practical', label: 'Practical' },
                { value: 'Lab', label: 'Lab' },
                { value: 'Project', label: 'Project' },
              ]}
            />

            <Input
              label="Credits"
              type="number"
              {...register('credits', { valueAsNumber: true })}
              error={errors.credits?.message}
              required
              min="1"
              max="10"
            />
          </div>

          <Textarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Brief description of the subject..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingSubject}
        onClose={() => setDeletingSubject(null)}
        title="Confirm Delete"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeletingSubject(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteSubjectMutation.isPending}
            >
              Delete Subject
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteSubjectMutation.error && (
            <Alert variant="error">
              {deleteSubjectMutation.error.response?.data?.message || 'Failed to delete subject'}
            </Alert>
          )}
          <p className="text-gray-700">
            Are you sure you want to delete the subject <strong>{deletingSubject?.subject_name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default SubjectManagement;
