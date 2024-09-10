import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Content from '@/models/Content';
import connectMongo from "@/libs/mongoose";

async function getTokens(supabase, userId) {
  const { data, error } = await supabase
    .from('Users')
    .select('tokens')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(error.message);
  }

  return data.tokens;
}

async function getTexts(userId) {
  await connectMongo();

  const result = await Content.aggregate([
    { $match: { userId: userId, contentType: "text" } },
    { $group: {
        _id: {
          $cond: { 
            if: { $in: ["$status", ['waiting', 'processing', 'processed']] }, 
            then: "processing", 
            else: "completed" 
          }
        },
        texts: {
          $push: {
            $cond: {
              if: { $in: ["$status", ['waiting', 'processing', 'processed']] },
              then: {
                id: { $toString: "$_id" },
                wordCount: "$wordCount",
                uploadTime: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$uploadTime" } },
                contentPreview: { $substr: ["$content", 0, 50] }
              },
              else: {
                id: { $toString: "$_id" },
                URL: "$docUrl",
                ExpireTime: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$docExpireAt" } },
                contentPreview: { $substr: ["$content", 0, 50] }
              }
            }
          }
        }
    }}
  ]);

  const processingTexts = result.find(item => item._id === "processing")?.texts || [];
  const completedTexts = result.find(item => item._id === "completed")?.texts || [];

  return { processingTexts, completedTexts };
}

export async function GET(req) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ error: 'Error getting session' }, { status: 500 })
  }

  if (!session) {
    console.log('No session found')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 并行运行 getTokens 和 getTexts
    const [tokens, texts] = await Promise.all([
      getTokens(supabase, session.user.id),
      getTexts(session.user.id)
    ]);

    return NextResponse.json({
      email: session.user.email,
      tokens,
      ...texts
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ message: 'Error fetching user data', error: error.message }, { status: 500 });
  }
}