import { NextResponse } from 'next/server';

const API_URL = 'https://v6.exchangerate-api.com/v6/fd727939766dc554339a3579/latest/GBP';

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    if (retries === 1) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency');

  try {
    const response = await fetchWithRetry(API_URL);
    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    const rate = data.conversion_rates[currency];

    if (!rate) {
      throw new Error('Currency rate not found');
    }

    return NextResponse.json({ rate });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exchange rate. Please refresh the page or use the default currency (GBP).' }, { status: 500 });
  }
}