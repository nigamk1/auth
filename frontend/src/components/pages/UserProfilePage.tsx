import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfileSchema } from '../../utils/validation';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { UpdateProfileRequest } from '../../types';

export const UserProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileRequest>({
    resolver: yupResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileRequest) => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      await updateProfile(data);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Profile Information
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                register={register}
                error={errors.firstName?.message}
              />

              <InputField
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                register={register}
                error={errors.lastName?.message}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tell us about yourself..."
                {...register('bio')}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                register={register}
                error={errors.dateOfBirth?.message}
              />

              <InputField
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                register={register}
                error={errors.phoneNumber?.message}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center">
                <span className="text-sm text-gray-900">{user.email}</span>
                {user.isEmailVerified ? (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Not Verified
                  </span>
                )}
              </div>
            </div>

            {error && <Alert type="error" message={error} />}
            {message && <Alert type="success" message={message} />}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                Update Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
