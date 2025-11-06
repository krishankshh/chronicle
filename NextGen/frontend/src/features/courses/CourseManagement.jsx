/**
 * Course Management Page - Staff/Admin view to manage courses
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Button, Alert, Badge, Modal, Input, Textarea, Pagination } from '../../components/ui';
import SearchFilter from '../../components/SearchFilter';

// Validation schema
const courseSchema = z.object({
  course_name: z.string().min(1, 'Course name is required'),
  course_code: z.string().min(1, 'Course code is required'),
  department: z.string().min(1, 'Department is required'),
  duration_years: z.number().min(1).max(6, 'Duration must be between 1 and 6 years'),
  total_semesters: z.number().min(1).max(12, 'Semesters must be between 1 and 12'),
  description: z.string().optional(),
});

const CourseManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses', page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.department && { department: filters.department }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await api.get(`/courses?${params}`);
      return response.data;
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(courseSchema),
    values: editingCourse ? {
      course_name: editingCourse.course_name || '',
      course_code: editingCourse.course_code || '',
      department: editingCourse.department || '',
      duration_years: editingCourse.duration_years || 4,
      total_semesters: editingCourse.total_semesters || 8,
      description: editingCourse.description || '',
    } : undefined,
  });

  // Create mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCreateModal(false);
      reset();
    },
  });

  // Update mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditingCourse(null);
      reset();
    },
  });

  // Delete mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/courses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeletingCourse(null);
    },
  });

  const onSubmit = (data) => {
    const courseData = {
      ...data,
      duration_years: parseInt(data.duration_years),
      total_semesters: parseInt(data.total_semesters),
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse._id, data: courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    reset();
  };

  const handleDelete = (course) => {
    setDeletingCourse(course);
  };

  const confirmDelete = () => {
    if (deletingCourse) {
      deleteCourseMutation.mutate(deletingCourse._id);
    }
  };

  const filterOptions = [
    {
      name: 'department',
      label: 'Department',
      placeholder: 'All Departments',
      options: [
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'Information Technology', label: 'Information Technology' },
        { value: 'Electronics', label: 'Electronics' },
        { value: 'Mechanical', label: 'Mechanical' },
        { value: 'Civil', label: 'Civil' },
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
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-500 mt-1">Manage academic courses and programs</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Add New Course
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search by course name, code, or department..."
          onSearch={setSearch}
          onFilterChange={setFilters}
          filters={filterOptions}
        />

        {/* Courses Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : error ? (
            <Alert variant="error">
              Failed to load courses: {error.response?.data?.message || error.message}
            </Alert>
          ) : coursesData?.courses?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
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
                    {coursesData?.courses?.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                            {course.description && (
                              <div className="text-sm text-gray-500 max-w-md truncate">{course.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {course.course_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.duration_years} years ({course.total_semesters} semesters)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={course.status === 'Active' ? 'success' : 'default'}>
                            {course.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(course)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(course)}
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
              {coursesData?.pagination && (
                <div className="mt-4">
                  <Pagination
                    currentPage={coursesData.pagination.page}
                    totalPages={coursesData.pagination.pages}
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
        isOpen={showCreateModal || !!editingCourse}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCourse(null);
          reset();
        }}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCourse(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={createCourseMutation.isPending || updateCourseMutation.isPending}
            >
              {editingCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(createCourseMutation.error || updateCourseMutation.error) && (
            <Alert variant="error">
              {createCourseMutation.error?.response?.data?.message ||
                updateCourseMutation.error?.response?.data?.message ||
                'Operation failed'}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Name"
              {...register('course_name')}
              error={errors.course_name?.message}
              required
              placeholder="e.g., Bachelor of Technology"
            />

            <Input
              label="Course Code"
              {...register('course_code')}
              error={errors.course_code?.message}
              required
              placeholder="e.g., B.Tech"
            />

            <Input
              label="Department"
              {...register('department')}
              error={errors.department?.message}
              required
              placeholder="e.g., Computer Science"
            />

            <Input
              label="Duration (Years)"
              type="number"
              {...register('duration_years', { valueAsNumber: true })}
              error={errors.duration_years?.message}
              required
              min="1"
              max="6"
            />

            <Input
              label="Total Semesters"
              type="number"
              {...register('total_semesters', { valueAsNumber: true })}
              error={errors.total_semesters?.message}
              required
              min="1"
              max="12"
            />
          </div>

          <Textarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Brief description of the course..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        title="Confirm Delete"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeletingCourse(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteCourseMutation.isPending}
            >
              Delete Course
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteCourseMutation.error && (
            <Alert variant="error">
              {deleteCourseMutation.error.response?.data?.message || 'Failed to delete course'}
            </Alert>
          )}
          <p className="text-gray-700">
            Are you sure you want to delete the course <strong>{deletingCourse?.course_name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CourseManagement;
