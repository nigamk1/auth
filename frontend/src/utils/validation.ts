import * as yup from 'yup';

// Common validation patterns
const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

const passwordSchema = yup
  .string()
  .min(6, 'Password must be at least 6 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .required('Password is required');

const nameSchema = yup
  .string()
  .trim()
  .min(1, 'This field is required')
  .max(50, 'Maximum 50 characters allowed')
  .required('This field is required');

// Login validation schema
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

// Registration validation schema
export const registerSchema = yup.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: nameSchema,
  lastName: nameSchema,
});

// Forgot password validation schema
export const forgotPasswordSchema = yup.object({
  email: emailSchema,
});

// Reset password validation schema
export const resetPasswordSchema = yup.object({
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Change password validation schema
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

// Update profile validation schema
export const updateProfileSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'Maximum 50 characters allowed')
    .required('First name is required'),
  lastName: yup
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Maximum 50 characters allowed')
    .required('Last name is required'),
  bio: yup
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .transform((value) => value === '' ? undefined : value),
  dateOfBirth: yup
    .string()
    .optional()
    .transform((value) => value === '' ? undefined : value),
  phoneNumber: yup
    .string()
    .optional()
    .transform((value) => value === '' ? undefined : value)
    .test('is-valid-phone', 'Please enter a valid phone number', (value) => {
      if (!value) return true; // Allow empty values
      return /^[\+]?[1-9][\d]{0,15}$/.test(value);
    }),
});

// Validation helper functions
export const validateField = async (
  schema: yup.AnySchema,
  value: any
): Promise<string | undefined> => {
  try {
    await schema.validate(value);
    return undefined;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Validation error';
  }
};

export const validateForm = async <T extends Record<string, any>>(
  schema: yup.ObjectSchema<any>,
  values: T
): Promise<Partial<Record<keyof T, string>>> => {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Partial<Record<keyof T, string>> = {};
      
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path as keyof T] = err.message;
        }
      });
      
      return errors;
    }
    return {};
  }
};

// Email validation utility
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length < 6) {
    suggestions.push('Use at least 6 characters');
  } else if (password.length >= 8) {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    suggestions.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    suggestions.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    suggestions.push('Add numbers');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Add special characters');
  } else {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  let label = 'Very Weak';
  if (score >= 2) label = 'Weak';
  if (score >= 3) label = 'Fair';
  if (score >= 4) label = 'Good';
  if (score >= 5) label = 'Strong';

  return { score, label, suggestions };
};
