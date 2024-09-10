import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const { tokenAmount, userId, currency, discountCode } = await req.json();

    console.log(`Creating checkout session for user ${userId} for ${tokenAmount} tokens in ${currency}`);

    if (!userId || !tokenAmount || !currency) {
      console.error('Missing required fields: userId, tokenAmount, or currency');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let exchangeRate = 1;
    if (currency !== 'GBP') {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/exchange-rate?currency=${currency}`);
      const data = await response.json();
      exchangeRate = data.rate;
    }

    const unitAmount = Math.ceil(exchangeRate * 100); 
    
    let discountPercentage = 0;
    if (discountCode) {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('discount_percentage')
        .eq('code', discountCode)
        .single();

      if (data) {
        discountPercentage = data.discount_percentage;
      }
    }

    const discountedUnitAmount = Math.ceil(unitAmount * discountPercentage);

    let session;
    if (currency == 'CNY') {
     session = await stripe.checkout.sessions.create({
      payment_method_options: {
        wechat_pay: {
          client: 'web',
        }
      },
      payment_method_types: ['card', 'wechat_pay', 'alipay'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Tokens',
              description: `${tokenAmount * 100} tokens`,
            },
            unit_amount: discountedUnitAmount,
          },
          quantity: tokenAmount,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-tokens`,
      client_reference_id: userId,
      metadata: {
    tokenAmount: (tokenAmount * 100).toString(),  
    discountCode: discountCode || '',
  },
    });
   } else {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Tokens',
              description: `${tokenAmount * 100} tokens`,
            },
            unit_amount: discountedUnitAmount,
          },
          quantity: tokenAmount,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-tokens`,
      client_reference_id: userId,
      metadata: {
    tokenAmount: (tokenAmount * 100).toString(),  
    discountCode: discountCode || '',
  },
    });
   }


    console.log(`Checkout session created successfully: ${session.id}`);
    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Error in create-checkout-session:', err);
    if (err instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', err.message);
      return NextResponse.json({ error: `Stripe error: ${err.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}