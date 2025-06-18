import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { changePasswordSchema } from '../../utils/validation';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import Alert from '../ui/Alert';
import type { ChangePasswordRequest } from '../../types';

export const ChangePasswordPage: React.FC = () => {
  const { changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordRequest>({
    resolver: yupResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordRequest) => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      await changePassword(data);
      setMessage('Password changed successfully!');
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Change Password
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputField
              label="Current Password"
              name="currentPassword"
              type="password"
              placeholder="Enter your current password"
              register={register}
              error={errors.currentPassword?.message}
            />

            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Enter your new password"
              register={register}
              error={errors.newPassword?.message}
            />

            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              register={register}
              error={errors.confirmPassword?.message}
            />

            {error && <Alert type="error" message={error} />}
            {message && <Alert type="success" message={message} />}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
