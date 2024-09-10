'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.hash);
      if (error) {
        console.error('Error exchanging code for session:', error);
        alert('Verification failed. Please try again or contact support.');
      }
      router.push('/login');
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return <div>Redirecting to login...</div>;
}