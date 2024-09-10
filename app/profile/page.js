'use client';

import Link from 'next/link'
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BetterIcon from '@/components/BetterIcon';
import styles from './Profile.module.css';

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { session, loading } = useAuth();  

  useEffect(() => {
    if (loading) return;  

    if (session) {
      fetchProfileData();
    } else {
      router.push('/login');
    }
  }, [session, loading, router]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile-data');
      const data = await response.json();

      if (response.ok) {
        setProfileData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchProfileData();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(date);
  };

  if (loading || isLoading) {
    return <div className={styles.loadingContainer}><BetterIcon icon="loading" spin /> Loading...</div>;
  }

  if (!session) {
    return null;  
  }

  if (!profileData) {
    return <div className={styles.errorContainer}>Unable to load profile data. Please try again later.</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>
        <BetterIcon icon="user" /> Profile
      </h1>
      <div className={styles.profileInfo}>
        <p><BetterIcon icon="envelope" /> Email: {profileData.email}</p>
        <p><BetterIcon icon="coins" /> Tokens: {profileData.tokens}</p>
        <button className={styles.refreshButton} onClick={refreshData}>
          <BetterIcon icon="sync" /> Refresh All Data
        </button>
      </div>

      <h2 className={styles.sectionTitle}>
        <BetterIcon icon="hourglass-half" /> Processing Texts
      </h2>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Text ID</th>
              <th>Upload Time</th>
              <th>Word Count</th>
              <th>Content Preview</th>
            </tr>
          </thead>
          <tbody>
            {profileData.processingTexts.map((text) => (
              <tr key={text.id}>
                <td>{text.id}</td>
                <td>{formatDate(text.uploadTime)}</td>
                <td>{text.wordCount}</td>
                <td>{text.contentPreview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={styles.sectionTitle}>
        <BetterIcon icon="check-circle" /> Completed Texts
      </h2>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Text ID</th>
              <th>Download</th>
              <th>Expire Time</th>
              <th>Content Preview</th>
            </tr>
          </thead>
          <tbody>
            {profileData.completedTexts.map((text) => (
              <tr key={text.id}>
                <td>{text.id}</td>
                <td>
                  <a href={text.URL} download className={styles.downloadLink}>
                    <BetterIcon icon="download" /> Download
                  </a>
                </td>
                <td>{formatDate(text.ExpireTime)}</td>
                <td>{text.contentPreview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/transaction-history" className={styles.transactionLink}>
        <BetterIcon icon="history" /> View Transaction History
      </Link>
    </div>
  );
}