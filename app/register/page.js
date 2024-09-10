'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Register() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviterError, setInviterError] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();

  const checkEmail = async (email) => {
    const response = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data.exists;
  };

  const checkInviter = async (email) => {
    if (!email) return true; // 如果没有邀请人，直接返回 true
    const response = await fetch('/api/check-inviter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data.exists;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isRegistered) return; // 防止重复提交

    setIsLoading(true);
    setInviterError('');
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      setIsLoading(false);
      return;
    }
    
    if (email) {
      const emailExists = await checkEmail(email);
      if (emailExists) {
        alert('This email is already registered. Redirecting to login page.');
        router.push('/login');
        setIsLoading(false);
        return;
      }
    }

    if (invitedBy) {
      const inviterExists = await checkInviter(invitedBy);
      if (!inviterExists) {
        setInviterError('Inviter email does not exist in our system.');
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, invitedBy }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setIsRegistered(true);
        setResendCountdown(60); 
      } else {
        alert('Registration failed: ' + data.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0) return;

    setResendCountdown(60);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Resend successful:', data);
        alert('Verification email sent. Please check your inbox.');
      } else {
        throw new Error(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      alert('Error sending verification email: ' + error.message);
    }
  };

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input input-bordered w-full mb-2"
          disabled={isRegistered}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input input-bordered w-full mb-2"
          disabled={isRegistered}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="input input-bordered w-full mb-2"
          disabled={isRegistered}
        />
        <input
          type="email"
          value={invitedBy}
          onChange={(e) => setInvitedBy(e.target.value)}
          placeholder="Invited by (optional)"
          className="input input-bordered w-full mb-2"
          disabled={isRegistered}
        />
        {inviterError && <p className="text-red-500 text-xs">{inviterError}</p>}
        <button 
          type="submit" 
          className={`btn btn-primary w-full mb-2 ${isLoading ? 'loading' : ''}`}
          disabled={isLoading || isRegistered}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
        <button 
          type="button" 
          onClick={handleResendVerification} 
          disabled={resendCountdown > 0 || !isRegistered}
          className="btn btn-secondary w-full mb-2"
        >
          {resendCountdown > 0 && isRegistered
            ? `Resend in ${resendCountdown}s` 
            : 'Resend Verification Email'}
        </button>
      </form>
    </div>
  );
}