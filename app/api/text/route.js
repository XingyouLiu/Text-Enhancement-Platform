import Bull from 'bull';
import { NextResponse } from 'next/server';
import Content from '@/models/Content';
import connectMongo from "@/libs/mongoose";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getTokenizer } from '@/libs/tokenizer';

const processingQueue = new Bull('processing', {
  redis: { port: 6379, host: '127.0.0.1' }
});

const tokenizer = getTokenizer();

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.log('Session found');

    const { text } = await request.json();

    // Calculate word count
    const wordCount = tokenizer.tokenize(text).length;
    console.log('Word count:', wordCount);

    // Check if word count is within allowed range
    if (wordCount < 400 || wordCount > 15000) {
      console.log('Word count out of range:', wordCount);
      return NextResponse.json({ message: 'Text must be between 400 and 15000 words.' }, { status: 400 });
    }

    const tokensToSpend = Math.round(wordCount);

    // Fetch user's token count
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

    if (tokensToSpend <= userTokens) {
      // 用户有足够的 tokens
      console.log('User has enough tokens');

      // 开始一个 Supabase 事务
      const { data, error } = await supabase.rpc('update_tokens_and_add_transaction', {
        p_user_id: session.user.id,
        p_amount: -tokensToSpend
      });

      if (error) {
        console.error('Error updating user tokens and adding transaction:', error);
        return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
      }

      // Connect to MongoDB
      console.log('Connecting to MongoDB...');
      await connectMongo();
      console.log('Connected to MongoDB');

      // 将文本存入 MongoDB
      console.log('Inserting text into MongoDB...');
      const content = new Content({
        userId: session.user.id,
        email: session.user.email,
        contentType: 'text',
        content: text,
        status: 'waiting',
        wordCount: wordCount,
        uploadTime: new Date()
      });
      const savedContent = await content.save();
      console.log('Text inserted into MongoDB');

      // 将文本 ID 加入处理队列
      console.log('Adding to processing queue...');
      await processingQueue.add({ type: 'text', id: savedContent._id.toString() });
      console.log('Added to processing queue');

      return NextResponse.json({ message: 'Text saved and queued for processing' });
    } else {
      // 用户 tokens 不足
      console.log('User does not have enough tokens');

      // 连接到 MongoDB
      console.log('Connecting to MongoDB...');
      await connectMongo();
      console.log('Connected to MongoDB');

      // 临时保存文本
      const tempContent = new Content({
        userId: session.user.id,
        email: session.user.email,
        contentType: 'temp_text',
        content: text,
        status: 'waiting',
        expireAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      });
      const savedTempContent = await tempContent.save();

      console.log('Returning response for insufficient tokens:', {
        message: 'Not enough tokens',
        tempContentId: savedTempContent._id.toString()
      });

      return NextResponse.json({ 
        message: 'Not enough tokens', 
        redirect: '/buy-tokens',
        tempContentId: savedTempContent._id.toString()
      }, { status: 402 });
    }
  } catch (error) {
    console.error('Error in POST /api/text:', error);
    return NextResponse.json({ message: 'Error processing text', error: error.toString() }, { status: 500 });
  }
}