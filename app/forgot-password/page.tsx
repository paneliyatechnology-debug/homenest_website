import React from 'react';
import type { Metadata } from 'next';
import { AdminHeroBanner } from '@/components/auth/admin-hero-banner';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'HomeNest',
  description: 'Recover your HomeNest Admin account password.',
};

export default function ForgotPasswordPage() {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden">
      {/* Left Column: Architectural Hero Banner (~44% matching Figma) */}
      <section className="w-full lg:w-[45%] xl:w-[44%] lg:h-screen relative flex shrink-0">
        <AdminHeroBanner
          welcomeTitle="Password Recovery"
          welcomeDescription="Keep your community secure with seamless administrative account recovery."
          className="w-full"
        />
      </section>

      {/* Right Column: Forgot Password Form (~56% matching Figma) */}
      <section className="w-full lg:w-[55%] xl:w-[56%] min-h-screen lg:h-screen flex flex-col bg-white">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
