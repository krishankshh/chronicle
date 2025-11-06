/**
 * Student Profile Page - View and edit student profile
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Card, Input, Select, Textarea, Button, Alert, Badge } from '../../components/ui';
import ImageUpload from '../../components/ImageUpload';

// Validation schema
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  course: z.string().min(1, 'Course is required'),
  semester: z.number().min(1).max(10, 'Invalid semester'),
  batch: z.string().optional(),
  mob_no: z.string().optional(),
  about_student: z.string().optional(),
});

const StudentProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const queryClient = useQueryClient();

  // Fetch student profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const response = await api.get('/students/profile');
      return response.data.student;
    },
  });

  // Form setup
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
      course: profileData.course || '',
      semester: profileData.semester || 1,
      batch: profileData.batch || '',
      mob_no: profileData.mob_no || '',
      about_student: profileData.about_student || '',
    } : undefined,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/students/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      setIsEditing(false);
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/students/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
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

  const onSubmit = (data) => {
    updateProfileMutation.mutate({
      ...data,
      semester: parseInt(data.semester),
    });
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
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
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
              currentImage={profileData?.student_img ? `http://localhost:5000${profileData.student_img}` : null}
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
            profileData?.status && (
              <Badge variant={profileData.status === 'Active' ? 'success' : 'default'}>
                {profileData.status}
              </Badge>
            )
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roll Number (read-only) */}
              <Input
                label="Roll Number"
                value={profileData?.roll_no || ''}
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

              {/* Course */}
              <Input
                label="Course"
                {...register('course')}
                error={errors.course?.message}
                disabled={!isEditing}
                required
              />

              {/* Semester */}
              <Select
                label="Semester"
                {...register('semester', { valueAsNumber: true })}
                error={errors.semester?.message}
                disabled={!isEditing}
                required
                options={Array.from({ length: 10 }, (_, i) => ({
                  value: i + 1,
                  label: `Semester ${i + 1}`,
                }))}
              />

              {/* Batch */}
              <Input
                label="Batch"
                {...register('batch')}
                error={errors.batch?.message}
                disabled={!isEditing}
                placeholder="e.g., 2020-2024"
              />
            </div>

            {/* About */}
            <Textarea
              label="About Me"
              {...register('about_student')}
              error={errors.about_student?.message}
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
    </div>
  );
};

export default StudentProfile;
