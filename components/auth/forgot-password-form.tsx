'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/form-input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';

export interface ForgotPasswordFormData {
  email: string;
}

export const initialForgotPasswordFormData: ForgotPasswordFormData = {
  email: '',
};

export const ForgotPasswordForm: React.FC = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<ForgotPasswordFormData>(initialForgotPasswordFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const resetForm = () => {
    setFormData(initialForgotPasswordFormData);
    setError(undefined);
    formRef.current?.reset();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldKey = name === 'no_autofill_email' ? 'email' : name;
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    if (error) setError(undefined);
  };

  // Strictly wipe fields on mount and browser back/forward cache navigation
  useEffect(() => {
    const wipeDomInputs = () => {
      if (formRef.current) {
        const inputs = formRef.current.querySelectorAll<HTMLInputElement>(
          'input:not([type="checkbox"]):not([name^="fake_"])'
        );
        inputs.forEach((input) => {
          if (input.value) {
            input.value = '';
          }
        });
      }
    };

    wipeDomInputs();
    const t1 = setTimeout(wipeDomInputs, 50);
    const t2 = setTimeout(wipeDomInputs, 200);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetForm();
        wipeDomInputs();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleClearAndNavigate = (path: string) => {
    resetForm();
    router.push(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setError('Email address is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      const response = await authService.forgotPassword(trimmedEmail);
      setLoading(false);

      if (response.success) {
        resetForm();
        router.push('/');
      }
    } catch {
      setLoading(false);
      // Backend error toast is handled automatically by apiClient
    }
  };

  return (
    <div className="w-full h-full lg:h-screen flex flex-col justify-between items-center px-6 sm:px-10 lg:px-12 xl:px-16 py-8 sm:py-10 bg-white overflow-y-auto">
      {/* Centered Form Wrapper matching Figma's exact 420px scale */}
      <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col justify-center">
        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
            Forgot Password
          </h2>
          <p className="text-xs sm:text-[13px] text-gray-500 mt-1 leading-relaxed">
            Enter your registered email address and we will send you a link to reset your password.
          </p>
        </div>

        {/* Forgot Password Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-4"
        >
          {/* Decoy trap inputs to attract and neutralize aggressive browser autofill */}
          <div
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0.01,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: -1,
            }}
            aria-hidden="true"
            tabIndex={-1}
          >
            <input
              type="text"
              name="fake_username_trap"
              tabIndex={-1}
              autoComplete="username"
              defaultValue=""
            />
            <input
              type="password"
              name="fake_password_trap"
              tabIndex={-1}
              autoComplete="current-password"
              defaultValue=""
            />
          </div>

          <FormInput
            id="forgot_email_input"
            name="no_autofill_email"
            type="text"
            inputMode="email"
            label="Email Address"
            placeholder="admin@homenest.com"
            value={formData.email}
            onChange={handleChange}
            error={error}
            autoComplete="new-password"
            data-lpignore="true"
            disabled={loading}
          />

          {/* Submit Button */}
          <div className="mt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              label={loading ? 'Sending Link...' : 'Send Reset Link'}
            />
          </div>

          {/* Back to Login */}
          <div className="text-center pt-2">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleClearAndNavigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-[#175c46] hover:text-[#124b38] font-medium transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      </div>

      {/* Support Footer */}
      <div className="w-full max-w-[420px] mx-auto text-center flex items-center justify-center gap-2 text-xs sm:text-[13px] text-gray-600 pt-6">
        <svg
          className="w-4 h-4 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm18 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z"
          />
        </svg>
        <span>
          Need help?{' '}
          <Link
            href="#support"
            className="text-[#175c46] font-medium underline hover:text-[#124b38] transition-colors"
          >
            Contact support
          </Link>
        </span>
      </div>
    </div>
  );
};
