'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/libs/supabaseClient';
import ButtonGradient from '@/components/ButtonGradient';

export default function FileUpload() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isValidFile, setIsValidFile] = useState(false);
  const [isValidSize, setIsValidSize] = useState(false);
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (selectedFile.size <= 10 * 1024 * 1024) { 
          setFile(selectedFile);
          setIsValidFile(true);
          setIsValidSize(true);
        } else {
          setFile(null);
          setIsValidFile(false);
          setIsValidSize(false);
          alert('File size exceeds 10 MB limit. Please select a smaller file.');
        }
      } else {
        setFile(null);
        setIsValidFile(false);
        setIsValidSize(false);
        alert('Please select a valid .docx document');
      }
    } else {
      setFile(null);
      setIsValidFile(false);
      setIsValidSize(false);
    }
  };

  const updateTokensToSpend = (words) => {
    const tokens = Math.round(words);
    setTokensToSpend(tokens);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a document first');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const wordCountResponse = await fetch('/api/get-word-count', {
        method: 'POST',
        body: formData
      });
      const wordCountData = await wordCountResponse.json();
      
      if (wordCountResponse.ok) {
        const confirmMessage = `Word count: ${wordCountData.wordCount}\n` +
          `Tokens to spend: ${wordCountData.tokensToSpend}\n\n` +
          `Do you want to proceed?`;

        if (window.confirm(confirmMessage)) {
          // If user confirms, proceed with the upload
          const uploadResponse = await fetch('/api/upload-docx', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tokensToSpend: wordCountData.tokensToSpend,
              text: wordCountData.text
            })
          });
          const uploadData = await uploadResponse.json();
          
          if (uploadResponse.ok) {
            setIsUploaded(true);
            setIsSubmitted(true);
            setWordCount(wordCountData.wordCount);
            setTokensToSpend(wordCountData.tokensToSpend);
            alert('Document submitted successfully. Please click Process button soon to prevent document expiration.');
          } else if (uploadResponse.status === 400) {
            alert(uploadData.message);
          } else if (uploadResponse.status === 402) {
            alert('Not enough tokens. Redirecting to purchase page.');
            router.push('/buy-tokens');
          } else {
            throw new Error(uploadData.message || 'Failed to upload');
          }
        } else {
          console.log('User cancelled the upload after seeing the confirmation');
        }
      } else if (wordCountResponse.status === 400) {
        alert(wordCountData.message);
      } else {
        throw new Error(wordCountData.message || 'Failed to get word count');
      }
    } catch (error) {
      alert('Failed to process: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!isUploaded) {
      alert('Please upload a document first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/process-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`File processed and added to the queue. Tokens spent: ${data.tokensSpent}`);
        router.push('/profile');
      } else if (response.status === 402) {
        alert('Not enough tokens. Redirecting to purchase page.');
        router.push('/buy-tokens');
      } else if (response.status === 404) {
        alert('The submitted document has expired. Please upload again.');
        setIsUploaded(false);
      } else {
        throw new Error(data.message || 'Failed to process');
      }
    } catch (error) {
      alert('Failed to process: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsUploaded(false);
    setIsValidFile(false);
    setIsValidSize(false);
    setTokensToSpend(0);
    setIsSubmitted(false);
    setWordCount(0);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-100 min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-primary/[0.05] bg-grid-8 [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <h1 className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-primary mb-8 text-center">
          Upload Document
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto mb-12 text-center">
          Upload your .docx file for AI-powered enhancement.
        </p>
        <form onSubmit={handleUpload} className="w-full max-w-2xl mx-auto">
          <div className="mb-6">
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="file-input file-input-bordered w-full bg-base-100 text-base-content"
              disabled={isLoading || isSubmitted}
            />
          </div>
          <div className="flex justify-center gap-4">
            <ButtonGradient
              title={isLoading ? 'Uploading...' : 'Submit'}
              onClick={handleUpload}
              disabled={isLoading || !isValidFile || !isValidSize || isSubmitted}
              className="btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            />
            <ButtonGradient
              title={isLoading ? 'Processing...' : 'Process'}
              onClick={handleProcess}
              disabled={!isUploaded || isLoading}
              className="btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            />
            <ButtonGradient
              title="Reset"
              onClick={handleReset}
              disabled={isLoading}
              className="btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            />
          </div>
        </form>
        {isUploaded && (
          <div className="mt-8 text-center">
            <p className="text-lg text-base-content/80">Word count: {wordCount}</p>
            <p className="text-lg text-base-content/80">Tokens to spend: {tokensToSpend}</p>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base-100 to-transparent" />
    </section>
  );
}