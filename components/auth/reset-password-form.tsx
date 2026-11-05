'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { FormPasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const toast = useRef<Toast>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

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
        setPassword('');
        setConfirmPassword('');
        setErrors({});
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
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    formRef.current?.reset();
    router.push(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.current?.show({
        severity: 'error',
        summary: 'Invalid Token',
        detail: 'Invalid or missing password reset token. Please request a new link.',
        life: 4000,
      });
      return;
    }

    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authService.resetPassword({
        token,
        password,
      });
      setLoading(false);

      if (response.success) {
        // Save flash toast for display on login page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              type: 'password_reset_success',
              detail:
                response.message ||
                'Password has been reset successfully. You can now login with your new password.',
            })
          );
        }

        // Clear password inputs and redirect immediately to Login Page
        setPassword('');
        setConfirmPassword('');
        formRef.current?.reset();
        router.push('/?toast=password_reset_success');
      } else {
        // On error, stay on Reset Password page and show error toast
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: response.message || 'Failed to reset password',
          life: 4000,
        });
      }
    } catch (err) {
      setLoading(false);
      const errorMsg =
        err instanceof ApiError
          ? err.message || 'Reset token expired or invalid.'
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
            Reset Password
          </h2>
          <p className="text-xs sm:text-[13px] text-gray-500 mt-1 leading-relaxed">
            Create a new, strong password to secure your admin account.
          </p>
        </div>

        {!token ? (
          /* Missing Token Warning */
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Missing Token</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                This link is missing a valid reset token or has expired. Please request a new password reset link.
              </p>
            </div>
            <Link
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                handleClearAndNavigate('/forgot-password');
              }}
              className="mt-2 w-full h-[40px] bg-[#175c46] hover:bg-[#124b38] text-white text-xs font-semibold rounded-lg flex items-center justify-center transition-all"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          /* Password Reset Form */
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

            <FormPasswordInput
              id="reset_new_password"
              name="no_autofill_new_password"
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              autoComplete="new-password"
              data-lpignore="true"
              disabled={loading}
            />

            <FormPasswordInput
              id="reset_confirm_password"
              name="no_autofill_confirm_password"
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
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
                label={loading ? 'Updating Password...' : 'Reset Password'}
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
        )}
      </div>

      {/* Support Help Footer */}
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
