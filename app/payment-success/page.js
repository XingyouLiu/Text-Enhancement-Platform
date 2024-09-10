'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.push('/login');
    } else {
      // 等待几秒钟后重定向到主页
      setTimeout(() => {
        router.push('/');
      }, 5000);
    }
  }, [session, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">
      <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
      <p>Your tokens will be added to your account shortly.</p>
      <p>You will be redirected to the homepage in a few seconds...</p>
    </div>
  );
}