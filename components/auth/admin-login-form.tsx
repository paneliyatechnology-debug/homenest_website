'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { FormInput } from '@/components/ui/form-input';
import { FormPasswordInput } from '@/components/ui/password-input';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import { clearAuthCookies } from '@/lib/cookies';

interface AdminLoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onSuccess,
  className = '',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useRef<Toast>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const hasShownToastRef = useRef<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

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
        setUsername('');
        setPassword('');
        setRememberMe(false);
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

  // Display success toasts from forgot-password/reset-password redirects and security alerts
  useEffect(() => {
    let flashType = searchParams.get('toast');
    let flashDetail = '';

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('homenest_flash_toast');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.type) {
            flashType = flashType || parsed.type;
            flashDetail = parsed.detail || '';
          }
          sessionStorage.removeItem('homenest_flash_toast');
        }
      } catch {
        // ignore storage parse error
      }
    }

    if (!flashType || hasShownToastRef.current === flashType) {
      return;
    }

    hasShownToastRef.current = flashType;

    if (flashType === 'reset_link_sent') {
      toast.current?.show({
        severity: 'success',
        summary: 'Reset Link Sent',
        detail:
          flashDetail ||
          'Password reset link has been sent to your email address.',
        life: 5000,
      });
    } else if (flashType === 'password_reset_success') {
      toast.current?.show({
        severity: 'success',
        summary: 'Password Reset Successful',
        detail:
          flashDetail ||
          'Password has been reset successfully. You can now login with your new password.',
        life: 5000,
      });
    } else if (flashType === 'auth_required') {
      toast.current?.show({
        severity: 'error',
        summary: 'Authentication Required',
        detail: 'Please sign in to your account to continue.',
        life: 4500,
      });
    } else if (flashType === 'session_expired') {
      toast.current?.show({
        severity: 'warn',
        summary: 'Session Expired',
        detail: 'Your session has expired. Please sign in again.',
        life: 4500,
      });
    } else if (flashType === 'unauthorized') {
      toast.current?.show({
        severity: 'error',
        summary: 'Unauthorized',
        detail:
          'Access denied. This portal is only accessible to administrator accounts.',
        life: 4500,
      });
    } else if (flashType === 'logged_out') {
      toast.current?.show({
        severity: 'success',
        summary: 'Signed Out',
        detail: flashDetail || 'You have been successfully signed out.',
        life: 4000,
      });
    } else if (flashType === 'registered_success') {
      toast.current?.show({
        severity: 'success',
        summary: 'Registration Successful',
        detail:
          flashDetail ||
          'Your PG account has been registered successfully! Please sign in with your credentials.',
        life: 6000,
      });
    }

    // Clean query parameter from URL after toast is shown without cancelling the alert
    if (typeof window !== 'undefined' && window.location.search) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, [searchParams]);

  const handleClearAndNavigate = (path: string) => {
    setUsername('');
    setPassword('');
    setRememberMe(false);
    setErrors({});
    formRef.current?.reset();
    router.push(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())) {
      newErrors.username = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    // Missing or invalid email/password: display field validation errors only (no toast)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Only if email and password are provided, verify Remember Me checkbox
    if (!rememberMe) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Remember Me Required',
        detail: 'Please check the "Remember me" checkbox to proceed with sign in.',
        life: 4000,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authService.login(
        {
          email: username.trim(),
          password,
        },
        rememberMe
      );

      if (response.success && response.data) {
        const userRole = (
          response.data.user?.role ||
          (response.data as unknown as { role?: string }).role ||
          ''
        ).toLowerCase();

        // Enforce admin-only access for the Admin Portal
        if (userRole !== 'admin') {
          clearAuthCookies();
          toast.current?.show({
            severity: 'error',
            summary: 'Unauthorized',
            detail: 'Access denied. This portal is only accessible to administrator accounts.',
            life: 4500,
          });
          return;
        }

        // Role is admin: proceed to dashboard
        toast.current?.show({
          severity: 'success',
          summary: 'Login Successful',
          detail: response.message || 'Welcome back to HomeNest!',
          life: 2500,
        });

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            handleClearAndNavigate('/dashboard');
          }
        }, 700);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Login Failed',
          detail: response.message || 'Login failed. Please check your credentials.',
          life: 4000,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof ApiError
          ? err.message || 'Invalid email or password.'
          : 'Unable to reach backend server. Please verify backend is running on port 5000.';

      toast.current?.show({
        severity: 'error',
        summary: 'Authentication Error',
        detail: errorMsg,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full h-full lg:h-screen flex flex-col justify-between items-center px-6 sm:px-10 lg:px-12 xl:px-16 py-8 sm:py-10 bg-white overflow-y-auto ${className}`}
    >
      {/* PrimeReact Toast Component */}
      <Toast ref={toast} position="top-right" />

      {/* Centered Form Wrapper matching Figma's exact 420px scale */}
      <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col justify-center">
        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
            Admin Login
          </h2>
          <p className="text-xs sm:text-[13px] text-gray-500 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Login Form Fields */}
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

          {/* Email / Username Field */}
          <FormInput
            id="login_username_input"
            name="no_autofill_username"
            type="text"
            inputMode="email"
            label="Email/Username"
            placeholder="admin@homenest.com"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            error={errors.username}
            autoComplete="new-password"
            data-lpignore="true"
            disabled={loading}
          />

          {/* Password Field */}
          <FormPasswordInput
            id="login_password_input"
            name="no_autofill_password"
            label="Password"
            placeholder="Enter your password"
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

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-0.5">
            <CheckboxField
              id="rememberMe"
              label="Remember me"
              checked={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
            />

            <Link
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                handleClearAndNavigate('/forgot-password');
              }}
              className="text-xs sm:text-[13px] font-normal text-[#175c46] underline hover:text-[#124b38] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Primary Button */}
          <div className="mt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              label={loading ? 'Signing In...' : 'Sign In'}
            />
          </div>
        </form>
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
