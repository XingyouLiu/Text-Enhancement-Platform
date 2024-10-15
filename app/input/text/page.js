'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ButtonGradient from '@/components/ButtonGradient';

export default function TextInput() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState('');
  const [tempContentId, setTempContentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClientComponentClient();
  const [wordCount, setWordCount] = useState(0);
  const [tokensToSpend, setTokensToSpend] = useState(0);

  const fetchTextById = async (id) => {
    try {
      const response = await fetch(`/api/id-to-text?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setText(data.content);
        console.log('Fetched text:', data.content);
      } else {
        console.error('Failed to fetch text');
      }
    } catch (error) {
      console.error('Error fetching text:', error);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    const newWordCount = countWords(newText);
    setWordCount(newWordCount);
    updateTokensToSpend(newWordCount);
  };

  const updateTokensToSpend = (words) => {
    const tokens = Math.round(words);
    setTokensToSpend(tokens);
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  useEffect(() => {
    if (loading) return;
    if (!session) {
      console.log('No session, redirecting to login');
      router.push('/login');
    } else {
      const savedTempContentId = localStorage.getItem('tempContentId');
      console.log('Checking for savedTempContentId:', savedTempContentId);
      if (savedTempContentId) {
        console.log('Found saved tempContentId:', savedTempContentId);
        fetchTextById(savedTempContentId);
        localStorage.removeItem('tempContentId');
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const confirmMessage = `Word count: ${wordCount}\n` +
      `Tokens to spend: ${tokensToSpend}\n\n` +
      `Do you want to proceed?`;

    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      setIsProcessing(true);
      try {
        console.log('Sending request to /api/text...');
        const response = await fetch('/api/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        console.log('Received response from /api/text, status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          alert('Saved and Added to the Queue: ' + data.message);
          router.push('/profile');
        } else if (response.status === 400) {
          alert(data.message);
          setIsProcessing(false);
        } else if (response.status === 401) {
          console.log('Unauthorized, redirecting to login');
          await supabase.auth.signOut();
          router.push('/login');
        } else if (response.status === 402) {
          console.log('Not enough tokens, should redirect');
          alert('Not enough tokens. Redirecting to purchase page.');
          localStorage.setItem('tempContentId', data.tempContentId);
          console.log('Stored tempContentId in localStorage:', data.tempContentId);
          router.push(data.redirect);
        } else {
          throw new Error(`Fail to Save: ${data.message}`);
        }
      } catch (error) {
        console.error('Error in handleSubmit:', error);
        alert('Error：' + error.message);
        setIsProcessing(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-100 min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-primary/[0.05] bg-grid-8 [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <h1 className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-primary mb-8 text-center">
          Input Your Text
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto mb-12 text-center">
          Enter your text below for AI-powered enhancement.
        </p>
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
          <div className="mb-6">
            <textarea
              className="textarea textarea-bordered w-full h-96 bg-base-100 text-base-content text-lg p-6 rounded-lg shadow-lg"
              value={text}
              onChange={handleTextChange}
              placeholder="Input your text here (400-15000 words)..."
              disabled={isProcessing}
            ></textarea>
            <div className="flex justify-between mt-2 text-sm text-base-content/60">
              <p>Word count: {wordCount}</p>
              <p>Tokens to spend: {tokensToSpend}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <ButtonGradient
              title={isLoading ? 'Processing...' : 'Process'}
              onClick={handleSubmit}
              disabled={isLoading || isProcessing}
              className="btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            />
          </div>
        </form>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base-100 to-transparent" />
    </section>
  );
}
