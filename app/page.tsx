import React, { Suspense } from 'react';
import { AdminHeroBanner } from '@/components/auth/admin-hero-banner';
import { AdminLoginForm } from '@/components/auth/admin-login-form';

export default function LoginPage() {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden">
      {/* Left Column: Architectural Hero Banner (~45% on desktop matching Figma) */}
      <section className="w-full lg:w-[45%] xl:w-[44%] lg:h-screen relative flex shrink-0">
        <AdminHeroBanner className="w-full" />
      </section>

      {/* Right Column: Admin Login Form (~55% on desktop matching Figma) */}
      <section className="w-full lg:w-[55%] xl:w-[56%] min-h-screen lg:h-screen flex flex-col bg-white">
        <Suspense fallback={<div className="h-full bg-white" />}>
          <AdminLoginForm className="h-full" />
        </Suspense>
      </section>
    </main>
  );
}
