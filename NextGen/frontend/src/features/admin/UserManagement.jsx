/**
 * User Management Page - Admin view to manage staff/admin users
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Button, Alert, Badge, Modal, Input, Select, Pagination } from '../../components/ui';
import SearchFilter from '../../components/SearchFilter';

// Validation schema for creating/editing users
const userSchema = z.object({
  login_id: z.string().min(1, 'Login ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  user_type: z.enum(['staff', 'admin'], { required_error: 'User type is required' }),
  mob_no: z.string().optional(),
});

const UserManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.user_type && { user_type: filters.user_type }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await api.get(`/users?${params}`);
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
    resolver: zodResolver(userSchema),
    values: editingUser ? {
      login_id: editingUser.login_id || '',
      name: editingUser.name || '',
      email: editingUser.email || '',
      user_type: editingUser.user_type || 'staff',
      mob_no: editingUser.mob_no || '',
    } : undefined,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      reset();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      reset();
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
  });

  const onSubmit = (data) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser._id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    reset();
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser._id);
    }
  };

  const filterOptions = [
    {
      name: 'user_type',
      label: 'User Type',
      placeholder: 'All Types',
      options: [
        { value: 'staff', label: 'Staff' },
        { value: 'admin', label: 'Admin' },
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage staff and admin accounts</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Add New User
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchPlaceholder="Search by name, login ID, or email..."
          onSearch={setSearch}
          onFilterChange={setFilters}
          filters={filterOptions}
        />

        {/* Users Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : error ? (
            <Alert variant="error">
              Failed to load users: {error.response?.data?.message || error.message}
            </Alert>
          ) : usersData?.users?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Login ID
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
                    {usersData?.users?.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.user_img ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`http://localhost:5000${user.user_img}`}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium text-sm">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.login_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.user_type === 'admin' ? 'primary' : 'info'}>
                            {user.user_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.status === 'Active' ? 'success' : 'default'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(user)}
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
              {usersData?.pagination && (
                <div className="mt-4">
                  <Pagination
                    currentPage={usersData.pagination.page}
                    totalPages={usersData.pagination.pages}
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
        isOpen={showCreateModal || !!editingUser}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
          reset();
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingUser(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(createUserMutation.error || updateUserMutation.error) && (
            <Alert variant="error">
              {createUserMutation.error?.response?.data?.message ||
                updateUserMutation.error?.response?.data?.message ||
                'Operation failed'}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Login ID"
              {...register('login_id')}
              error={errors.login_id?.message}
              disabled={!!editingUser}
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

            {!editingUser && (
              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                required
              />
            )}

            <Select
              label="User Type"
              {...register('user_type')}
              error={errors.user_type?.message}
              required
              options={[
                { value: 'staff', label: 'Staff' },
                { value: 'admin', label: 'Admin' },
              ]}
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
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirm Delete"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteUserMutation.isPending}
            >
              Delete User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteUserMutation.error && (
            <Alert variant="error">
              {deleteUserMutation.error.response?.data?.message || 'Failed to delete user'}
            </Alert>
          )}
          <p className="text-gray-700">
            Are you sure you want to delete the user <strong>{deletingUser?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
