'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function InputChoice() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-100 min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-primary/[0.05] bg-grid-8 [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <h1 className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-primary mb-8">
          Select Input Method
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto mb-12">
          Choose how you want to input your text for enhancement.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-8">
          <Link href="/input/text" className="btn btn-primary btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Input Text
          </Link>
          <Link href="/input/file" className="btn btn-secondary btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Upload Document
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base-100 to-transparent" />
    </section>
  );
}
