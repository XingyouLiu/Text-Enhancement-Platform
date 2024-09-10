'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import BetterIcon from '@/components/BetterIcon';
import styles from './BuyTokens.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BuyTokens() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [tokenAmount, setTokenAmount] = useState(1);
  const [totalPrice, setTotalPrice] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);
  const [error, setError] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    setTotalPrice((tokenAmount).toFixed(2));
  }, [tokenAmount]);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (selectedCurrency !== 'GBP') {
        setLoadingExchangeRate(true);
        setError(null);
        try {
          const response = await fetch(`/api/exchange-rate?currency=${selectedCurrency}`);
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setExchangeRate(data.rate);
        } catch (error) {
          setError(error.message || 'Failed to fetch exchange rate');
          setExchangeRate(null);
        } finally {
          setLoadingExchangeRate(false);
        }
      } else {
        setExchangeRate(1);
        setError(null);
      }
    };

    fetchExchangeRate();
  }, [selectedCurrency]);

  useEffect(() => {
    if (discountPercentage !== null) {
      const unitAmount = Math.ceil(exchangeRate * 100);
      const discountedUnitAmount = Math.ceil(unitAmount * discountPercentage);
      const discounted = tokenAmount * discountedUnitAmount / 100;
      setDiscountedPrice(discounted.toFixed(2));
    } else {
      setDiscountedPrice(null);
    }
  }, [totalPrice, discountPercentage, exchangeRate, tokenAmount]);

  const handleRetry = () => {
    setError(null);
    setSelectedCurrency('GBP');
  };

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
    setConfirmed(false);
  };

  const handleTokenAmountChange = (e) => {
    const value = Math.max(1, Math.floor(Number(e.target.value)));
    setTokenAmount(value);
    setConfirmed(false);
  };

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleDiscountCodeChange = (e) => {
    setDiscountCode(e.target.value);
    setDiscountPercentage(null);
    setDiscountedPrice(null);
    setDiscountError(null);
  };

  const handleCheckDiscount = async () => {
    if (!discountCode) return;

    setCheckingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch(`/api/check-discount?code=${encodeURIComponent(discountCode)}`);
      const data = await response.json();

      if (response.ok) {
        setDiscountPercentage(data.discountPercentage);
      } else {
        setDiscountError(data.error);
      }
    } catch (error) {
      setDiscountError('Failed to check discount code');
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleBuyTokens = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      const stripe = await stripePromise;
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAmount: tokenAmount,
          userId: session.user.id,
          currency: selectedCurrency,
          discountCode: discountCode,
        }),
      });

      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}><BetterIcon icon="loading" spin /> Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.buyTokensContainer}>
      <h1 className={styles.pageTitle}>
        <BetterIcon icon="shopping-cart" /> Buy Tokens
      </h1>
      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label htmlFor="tokenAmount" className={styles.label}>Number of 100-token packs:</label>
          <input
            type="number"
            id="tokenAmount"
            value={tokenAmount}
            onChange={handleTokenAmountChange}
            min="1"
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="currency" className={styles.label}>Currency:</label>
          <select
            id="currency"
            value={selectedCurrency}
            onChange={handleCurrencyChange}
            className={styles.select}
          >
            <option value="GBP">GBP</option>
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="discountCode" className={styles.label}>Discount Code (optional):</label>
          <div className={styles.discountInputContainer}>
            <input
              type="text"
              id="discountCode"
              value={discountCode}
              onChange={handleDiscountCodeChange}
              className={styles.input}
            />
            <button
              onClick={handleCheckDiscount}
              className={`${styles.button} ${styles.secondaryButton} ${checkingDiscount ? styles.loading : ''}`}
              disabled={checkingDiscount || !discountCode}
            >
              Check Discount
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={handleRetry} className={`${styles.button} ${styles.outlineButton}`}>
            Try Again
          </button>
        </div>
      ) : (
        <div className={styles.summaryContainer}>
          <p>Total tokens: {tokenAmount * 100}</p>
          <p>
            Total price: {selectedCurrency === 'GBP' ? '£' : selectedCurrency === 'USD' ? '$' : '¥'}
            {exchangeRate ? (totalPrice * exchangeRate).toFixed(2) : 'N/A'}
          </p>
        </div>
      )}

      {discountError && (
        <div className={styles.errorMessage}>
          <p>{discountError}</p>
        </div>
      )}

      {discountPercentage !== null && (
        <div className={styles.discountInfo}>
          <p>Discount: {((1-discountPercentage) * 100).toFixed(2)}%</p>
          <p>Discounted Price: {selectedCurrency === 'GBP' ? '£' : selectedCurrency === 'USD' ? '$' : '¥'}
            {discountedPrice}
          </p>
        </div>
      )}

      {!confirmed && !error && (
        <button 
          onClick={handleConfirm} 
          className={`${styles.button} ${styles.secondaryButton} ${loadingExchangeRate ? styles.loading : ''}`}
          disabled={loadingExchangeRate || !exchangeRate}
        >
          {loadingExchangeRate ? 'Loading...' : 'Confirm'}
        </button>
      )}

      <button 
        onClick={handleBuyTokens} 
        className={`${styles.button} ${styles.primaryButton} ${isLoading ? styles.loading : ''}`}
        disabled={isLoading || !confirmed || error || !exchangeRate}
      >
        {isLoading ? 'Processing...' : 'Buy Tokens'}
      </button>
    </div>
  );
}
