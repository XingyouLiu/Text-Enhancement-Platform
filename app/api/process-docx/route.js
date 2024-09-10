import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import connectMongo from "@/libs/mongoose";
import Content from '@/models/Content';
import Bull from 'bull';

const processingQueue = new Bull('processing', {
  redis: { port: 6379, host: '127.0.0.1' }
});

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }


    await connectMongo();

    // Find temp_text
    const tempContent = await Content.findOne({ userId: session.user.id, contentType: 'temp_text' });

    if (!tempContent) {
      return NextResponse.json({ message: 'No temporary content found or content expired' }, { status: 404 });
    }

    // Remove discount code logic
    const tokensToSpend = tempContent.wordCount;

    // Check user's tokens
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('tokens')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ message: 'Error fetching user data' }, { status: 500 });
    }

    const userTokens = userData.tokens;

    if (tokensToSpend > userTokens) {
      return NextResponse.json({ message: 'Not enough tokens', redirect: '/buy-tokens' }, { status: 402 });
    }

    // Start a Supabase transaction
    const { data, error } = await supabase.rpc('update_tokens_and_add_transaction', {
      p_user_id: session.user.id,
      p_amount: -tokensToSpend
    });

    if (error) {
      console.error('Error updating user tokens and adding transaction:', error);
      return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
    }

    // Update content type and remove expiration
    tempContent.contentType = 'text';
    tempContent.expireAt = undefined;
    await tempContent.save();

    // Add to processing queue
    await processingQueue.add({ type: 'text', id: tempContent._id.toString() });

    return NextResponse.json({ 
      message: 'Content processed and queued',
      tokensSpent: tokensToSpend,
      discountApplied: false
    });
  } catch (error) {
    console.error('Error in POST /api/process-docx:', error);
    return NextResponse.json({ message: 'Error processing content', error: error.toString() }, { status: 500 });
  }
}