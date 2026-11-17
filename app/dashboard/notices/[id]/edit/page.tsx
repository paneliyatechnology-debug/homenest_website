'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Notice } from '@/types/notice';
import { noticeService } from '@/services/notice.service';
import { NoticeForm } from '@/components/notices';
import { BrandLoader } from '@/components/ui';

export default function EditNoticePage() {
  const params = useParams();
  const router = useRouter();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const noticeId = params?.id ? String(params.id) : undefined;

  useEffect(() => {
    if (!noticeId) {
      router.push('/dashboard/notices');
      return;
    }

    let isMounted = true;
    noticeService
      .getNoticeById(noticeId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/dashboard/notices');
          return;
        }
        setNotice(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/dashboard/notices');
      });

    return () => {
      isMounted = false;
    };
  }, [noticeId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading notice details..." />
      </main>
    );
  }

  if (!notice) {
    return null;
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto bg-[#F7F7F5]">
      <NoticeForm
        key={notice.id}
        mode="edit"
        noticeId={notice.id}
        initialData={notice}
      />
    </main>
  );
}
