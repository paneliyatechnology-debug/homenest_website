import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminHeroBanner } from '@/components/auth/admin-hero-banner';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'HomeNest',
  description: 'Set a new password for your HomeNest Admin account.',
};

export default function ResetPasswordPage() {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden">
      {/* Left Column: Architectural Hero Banner (~44% matching Figma) */}
      <section className="w-full lg:w-[45%] xl:w-[44%] lg:h-screen relative flex shrink-0">
        <AdminHeroBanner
          welcomeTitle="Secure Your Account"
          welcomeDescription="Choose a strong, unique password to protect your resident records and operations."
          className="w-full"
        />
      </section>

      {/* Right Column: Reset Password Form wrapped in Suspense for searchParams */}
      <section className="w-full lg:w-[55%] xl:w-[56%] min-h-screen lg:h-screen flex flex-col bg-white">
        <Suspense
          fallback={
            <div className="w-full h-full min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#175c46] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
