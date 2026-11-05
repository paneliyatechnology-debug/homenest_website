'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { FormInput } from '@/components/ui/form-input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';

export const ForgotPasswordForm: React.FC = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

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
        setEmail('');
        setError(undefined);
        formRef.current?.reset();
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
    setEmail('');
    setError(undefined);
    formRef.current?.reset();
    router.push(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email address is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      setLoading(false);

      if (response.success) {
        // Save flash toast for display on login page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              type: 'reset_link_sent',
              detail:
                response.message ||
                'Password reset link has been sent to your email address.',
            })
          );
        }

        // Clear input and redirect immediately to Login Page
        setEmail('');
        formRef.current?.reset();
        router.push('/?toast=reset_link_sent');
      } else {
        // On error, stay on Forgot Password page and show error toast
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: response.message || 'Failed to send reset link',
          life: 4000,
        });
      }
    } catch (err) {
      setLoading(false);
      const errorMsg =
        err instanceof ApiError
          ? err.message || 'User with this email not found.'
          : 'Unable to connect to server. Please verify backend is running on port 5000.';

      toast.current?.show({
        severity: 'error',
        summary: 'Reset Failed',
        detail: errorMsg,
        life: 4000,
      });
    }
  };

  return (
    <div className="w-full h-full lg:h-screen flex flex-col justify-between items-center px-6 sm:px-10 lg:px-12 xl:px-16 py-8 sm:py-10 bg-white overflow-y-auto">
      {/* PrimeReact Toast Component */}
      <Toast ref={toast} position="top-right" />

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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(undefined);
            }}
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
