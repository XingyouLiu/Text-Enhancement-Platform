'use client';

import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Check your email to reset your password');
      } else {
        switch (response.status) {
          case 404:
            setMessage('User not found. Please check your email address.');
            break;
          case 400:
            setMessage('Email not verified. Please verify your email first.');
            break;
          case 500:
            setMessage('An error occurred. Please try again later.');
            break;
          default:
            setMessage(data.message || 'An unexpected error occurred');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input input-bordered w-full mb-2"
          required
        />
        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 text-center ${message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}