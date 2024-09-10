import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  console.log('Webhook received');
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('Event constructed successfully:', event.type);
    } catch (err) {
      console.error('Error constructing event:', err);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
    
      // 更新用户的 token 数量
      try {
        const userId = session.client_reference_id;
        if (!userId) {
          throw new Error('Missing client_reference_id in session');
        }

        // 从元数据中获取 token 数量
    const tokenAmount = parseInt(session.metadata.tokenAmount, 10);
    if (isNaN(tokenAmount)) {
      throw new Error('Invalid token amount in session metadata');
    }

        const discountCode = session.metadata.discountCode;

        // Update user tokens and add transaction
        const { data, error } = await supabase.rpc('add_tokens_and_transaction_with_referral', {
          p_user_id: userId,
          p_amount: tokenAmount
        });

        if (error) {
          console.error('Error updating user tokens, adding transaction, and processing referral:', error);
          throw error;
        }

        // Delete used discount code if it exists
        if (discountCode) {
          const { error: deleteError } = await supabase
            .from('discount_codes')
            .delete()
            .eq('code', discountCode);

          if (deleteError) {
            console.error('Error deleting used discount code:', deleteError);
          }
        }

        console.log('Tokens updated, transaction added, referral processed, and discount code deleted (if applicable)');

      } catch (error) {
        console.error('Error in token update process:', error);
        return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Unexpected error in webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}