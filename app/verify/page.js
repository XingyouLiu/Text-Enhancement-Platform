'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReCAPTCHA from "react-google-recaptcha";

export default function Verify() {
  const [token, setToken] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!captchaToken) {
      alert('Please complete the CAPTCHA');
      return;
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, captchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Email verified successfully');
        router.push('/login');
      } else {
        alert('Verification failed: ' + data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('An error occurred during verification. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Verify Your Email</h1>
      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        onChange={setCaptchaToken}
      />
      <button 
        onClick={handleVerify} 
        className="btn btn-primary mt-4"
        disabled={!captchaToken}
      >
        Verify Email
      </button>
    </div>
  );
}