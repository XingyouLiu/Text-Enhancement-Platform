'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleRecoveryLink = async () => {
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (access_token && refresh_token && type === 'recovery') {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });

            if (error) throw error;

            setMessage('Recovery link verified successfully. You can now reset your password.');
          } catch (error) {
            console.error('Error setting session:', error);
            setMessage('Error verifying recovery link. Please request a new one.');
          }
        } else {
          setMessage('Invalid recovery link. Please request a new one.');
        }
      } else {
        setMessage('No valid reset token found. Please request a new reset link.');
      }
      setIsLoading(false);
    };

    handleRecoveryLink();
  }, [supabase.auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({ password: password });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated successfully');

      // 清除用户 session
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Error signing out:', signOutError);
      }

      // 延迟重定向到登录页面
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage(error.message || 'An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold mb-4 text-center">Reset Password</h1>
        {message && <p className="text-sm mb-4 text-center">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            className="input input-bordered w-full mb-2"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="input input-bordered w-full mb-2"
          />
          <button 
            type="submit" 
            className={`btn btn-primary w-full mb-2 ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="text-center">
          <Link href="/login" className="link text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}