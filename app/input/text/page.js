'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ButtonGradient from '@/components/ButtonGradient';

// Add this import at the top of your file
import styles from './TextInput.module.css';

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

  const textareaStyle = {
    width: '180%',
    maxWidth: '200%',
    marginLeft: '-20%',
  };

  return (
    <section className="flex justify-center items-center w-full bg-base-200/50 text-base-content py-20 lg:py-32">
      <div className="flex flex-col max-w-5xl gap-16 md:gap-20 px-4">
        <h2 className="font-black text-4xl md:text-6xl tracking-[-0.02em] text-center">
          Input Your Text
        </h2>
        <div className="flex flex-col w-full h-fit gap-4 lg:gap-10 text-text-default">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
              <textarea
                style={textareaStyle}
                className="textarea textarea-bordered w-full h-96 bg-base-100 text-base-content text-lg p-6"
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
            <ButtonGradient
              title={isLoading ? 'Processing...' : 'Process'}
              onClick={handleSubmit}
              disabled={isLoading || isProcessing}
            />
          </form>
        </div>
      </div>
    </section>
  );
}