'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (authLoading) return;

    if (session) {
      fetchTransactions()
    } else {
      router.push('/login')
    }
  }, [session, authLoading, router])

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

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('TokenTransactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setTransactions(data)
    } catch (error) {
      console.error('Error:', error)
      setError('Error fetching transaction history')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  if (!session) return null; // 防止在重定向前显示内容

  return (
    <div>
      <h1>Transaction History</h1>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.transaction_id}>
              <td>{formatDate(transaction.timestamp)}</td>
              <td>{transaction.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}