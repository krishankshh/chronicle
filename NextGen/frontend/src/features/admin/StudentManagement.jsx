/**
 * Student Management Page - Admin view to manage all students
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Button, Alert, Badge, Modal, Input, Select, Pagination } from '../../components/ui';
import SearchFilter from '../../components/SearchFilter';

// Validation schema for creating/editing students
const studentSchema = z.object({
  roll_no: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  course: z.string().min(1, 'Course is required'),
  semester: z.number().min(1).max(10, 'Invalid semester'),
  batch: z.string().optional(),
  mob_no: z.string().optional(),
});

const StudentManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const queryClient = useQueryClient();

  // Fetch students
  const { data: studentsData, isLoading, error } = useQuery({
    queryKey: ['students', page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.course && { course: filters.course }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await api.get(`/students?${params}`);
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
    resolver: zodResolver(studentSchema),
    values: editingStudent ? {
      roll_no: editingStudent.roll_no || '',
      name: editingStudent.name || '',
      email: editingStudent.email || '',
      course: editingStudent.course || '',
      semester: editingStudent.semester || 1,
      batch: editingStudent.batch || '',
      mob_no: editingStudent.mob_no || '',
    } : undefined,
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/students', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowCreateModal(false);
      reset();
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditingStudent(null);
      reset();
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeletingStudent(null);
    },
  });

  const onSubmit = (data) => {
    const studentData = {
      ...data,
      semester: parseInt(data.semester),
    };

    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent._id, data: studentData });
    } else {
      createStudentMutation.mutate(studentData);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    reset();
  };

  const handleDelete = (student) => {
    setDeletingStudent(student);
  };

  const confirmDelete = () => {
    if (deletingStudent) {
      deleteStudentMutation.mutate(deletingStudent._id);
    }
  };

  const filterOptions = [
    {
      name: 'course',
      label: 'Course',
      placeholder: 'All Courses',
      options: [
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'Information Technology', label: 'Information Technology' },
        { value: 'Electronics', label: 'Electronics' },
        { value: 'Mechanical', label: 'Mechanical' },
        { value: 'Civil', label: 'Civil' },
      ],
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
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-500 mt-1">Manage student accounts and information</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Add New Student
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search by name, roll number, or email..."
          onSearch={setSearch}
          onFilterChange={setFilters}
          filters={filterOptions}
        />

        {/* Students Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : error ? (
            <Alert variant="error">
              Failed to load students: {error.response?.data?.message || error.message}
            </Alert>
          ) : studentsData?.students?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
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
                    {studentsData?.students?.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {student.student_img ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`http://localhost:5000${student.student_img}`}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium text-sm">
                                    {student.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.roll_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.course}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Semester {student.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={student.status === 'Active' ? 'success' : 'default'}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(student)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(student)}
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
              {studentsData?.pagination && (
                <div className="mt-4">
                  <Pagination
                    currentPage={studentsData.pagination.page}
                    totalPages={studentsData.pagination.pages}
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
        isOpen={showCreateModal || !!editingStudent}
        onClose={() => {
          setShowCreateModal(false);
          setEditingStudent(null);
          reset();
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingStudent(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={createStudentMutation.isPending || updateStudentMutation.isPending}
            >
              {editingStudent ? 'Update Student' : 'Create Student'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(createStudentMutation.error || updateStudentMutation.error) && (
            <Alert variant="error">
              {createStudentMutation.error?.response?.data?.message ||
                updateStudentMutation.error?.response?.data?.message ||
                'Operation failed'}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Roll Number"
              {...register('roll_no')}
              error={errors.roll_no?.message}
              disabled={!!editingStudent}
              required
            />

            <Input
              label="Full Name"
              {...register('name')}
              error={errors.name?.message}
              required
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            {!editingStudent && (
              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                required
              />
            )}

            <Input
              label="Course"
              {...register('course')}
              error={errors.course?.message}
              required
            />

            <Select
              label="Semester"
              {...register('semester', { valueAsNumber: true })}
              error={errors.semester?.message}
              required
              options={Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `Semester ${i + 1}`,
              }))}
            />

            <Input
              label="Batch"
              {...register('batch')}
              error={errors.batch?.message}
              placeholder="e.g., 2020-2024"
            />

            <Input
              label="Mobile Number"
              type="tel"
              {...register('mob_no')}
              error={errors.mob_no?.message}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        title="Confirm Delete"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeletingStudent(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteStudentMutation.isPending}
            >
              Delete Student
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteStudentMutation.error && (
            <Alert variant="error">
              {deleteStudentMutation.error.response?.data?.message || 'Failed to delete student'}
            </Alert>
          )}
          <p className="text-gray-700">
            Are you sure you want to delete the student <strong>{deletingStudent?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StudentManagement;
