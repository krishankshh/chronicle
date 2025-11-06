/**
 * User Profile Page - View and edit staff/admin profile
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Input, Textarea, Button, Alert, Badge, Modal } from '../../components/ui';
import ImageUpload from '../../components/ImageUpload';

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  mob_no: z.string().optional(),
  about_user: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data.user;
    },
  });

  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: profileData ? {
      name: profileData.name || '',
      email: profileData.email || '',
      mob_no: profileData.mob_no || '',
      about_user: profileData.about_user || '',
    } : undefined,
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsEditing(false);
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setUploadSuccess('Avatar uploaded successfully');
      setUploadError('');
      setSelectedImage(null);
      setTimeout(() => setUploadSuccess(''), 3000);
    },
    onError: (error) => {
      setUploadError(error.response?.data?.message || 'Failed to upload avatar');
      setUploadSuccess('');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/profile/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      return response.data;
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      resetPassword();
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleAvatarUpload = () => {
    if (selectedImage) {
      uploadAvatarMutation.mutate(selectedImage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Failed to load profile: {error.response?.data?.message || error.message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">View and manage your profile information</p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                <Button onClick={() => setShowPasswordModal(true)} variant="outline">
                  Change Password
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error messages */}
        {updateProfileMutation.isSuccess && !isEditing && (
          <Alert variant="success">
            Profile updated successfully!
          </Alert>
        )}
        {updateProfileMutation.error && (
          <Alert variant="error">
            {updateProfileMutation.error.response?.data?.message || 'Failed to update profile'}
          </Alert>
        )}

        {/* Avatar Upload */}
        <Card title="Profile Picture">
          <div className="space-y-4">
            <ImageUpload
              currentImage={profileData?.user_img ? `http://localhost:5000${profileData.user_img}` : null}
              onImageSelect={setSelectedImage}
              shape="circle"
              label="Upload Avatar"
            />
            {uploadSuccess && <Alert variant="success">{uploadSuccess}</Alert>}
            {uploadError && <Alert variant="error">{uploadError}</Alert>}
            {selectedImage && (
              <Button
                onClick={handleAvatarUpload}
                loading={uploadAvatarMutation.isPending}
              >
                Save Avatar
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Information */}
        <Card
          title="Profile Information"
          actions={
            <div className="flex items-center gap-2">
              {profileData?.user_type && (
                <Badge variant="info">
                  {profileData.user_type.toUpperCase()}
                </Badge>
              )}
              {profileData?.status && (
                <Badge variant={profileData.status === 'Active' ? 'success' : 'default'}>
                  {profileData.status}
                </Badge>
              )}
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Login ID (read-only) */}
              <Input
                label="Login ID"
                value={profileData?.login_id || ''}
                disabled
                className="bg-gray-50"
              />

              {/* Name */}
              <Input
                label="Full Name"
                {...register('name')}
                error={errors.name?.message}
                disabled={!isEditing}
                required
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                disabled={!isEditing}
                required
              />

              {/* Mobile Number */}
              <Input
                label="Mobile Number"
                type="tel"
                {...register('mob_no')}
                error={errors.mob_no?.message}
                disabled={!isEditing}
              />
            </div>

            {/* About */}
            <Textarea
              label="About Me"
              {...register('about_user')}
              error={errors.about_user?.message}
              disabled={!isEditing}
              placeholder="Tell us about yourself..."
              rows={4}
            />

            {/* Edit Mode Actions */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Account Info (read-only) */}
        <Card title="Account Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created At</p>
              <p className="font-medium">
                {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-medium">
                {profileData?.updated_at ? new Date(profileData.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          resetPassword();
        }}
        title="Change Password"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false);
                resetPassword();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              loading={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          {changePasswordMutation.isSuccess && (
            <Alert variant="success">
              Password changed successfully!
            </Alert>
          )}
          {changePasswordMutation.error && (
            <Alert variant="error">
              {changePasswordMutation.error.response?.data?.message || 'Failed to change password'}
            </Alert>
          )}

          <Input
            label="Current Password"
            type="password"
            {...registerPassword('current_password')}
            error={passwordErrors.current_password?.message}
            required
          />

          <Input
            label="New Password"
            type="password"
            {...registerPassword('new_password')}
            error={passwordErrors.new_password?.message}
            required
            helperText="Minimum 6 characters"
          />

          <Input
            label="Confirm New Password"
            type="password"
            {...registerPassword('confirm_password')}
            error={passwordErrors.confirm_password?.message}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
