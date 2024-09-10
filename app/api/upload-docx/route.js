import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import connectMongo from "@/libs/mongoose";
import Content from '@/models/Content';
import { getTokenizer } from '@/libs/tokenizer';

const tokenizer = getTokenizer();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { tokensToSpend, text } = await request.json();

    // Validate the input
    if (!tokensToSpend || !text) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const words = tokenizer.tokenize(text);
    const wordCount = words.length;

    if (wordCount < 400 || wordCount > 15000) {
      return NextResponse.json({ message: 'Text must be between 400 and 15000 words.' }, { status: 400 });
    }

    // Check user's tokens
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('tokens')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ message: 'Error fetching user data' }, { status: 500 });
    }

    const userTokens = userData.tokens;
    console.log('User tokens:', userTokens);

    if (tokensToSpend > userTokens) {
      console.log('Not enough tokens. Required:', tokensToSpend, 'Available:', userTokens);
      return NextResponse.json({ message: 'Not enough tokens', redirect: '/buy-tokens' }, { status: 402 });
    }

    // Store as temp_text in MongoDB
    console.log('Storing text in MongoDB...');
    await connectMongo();
    const updateResult = await Content.findOneAndUpdate(
      { userId: session.user.id, contentType: 'temp_text' },
      {
        email: session.user.email,
        content: text,
        status: 'waiting',
        wordCount: wordCount,
        expireAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      { upsert: true, new: true }
    );
    console.log('Text stored in MongoDB');

    console.log('File upload process completed successfully');
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      wordCount: wordCount,
      tokensToSpend: tokensToSpend
    });
  } catch (error) {
    console.error('Error in POST /api/upload-docx:', error);
    return NextResponse.json({ message: 'Error processing file', error: error.toString() }, { status: 500 });
  }
}