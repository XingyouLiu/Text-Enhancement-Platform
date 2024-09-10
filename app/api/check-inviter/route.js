import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req) {
  let { email } = await req.json();
  
  // 将邮箱转换为小写
  email = email.toLowerCase();

  try {
    const { data: user, error: userError } = await supabase
     .from('Users')
     .select('id, verification_token')
     .eq('email', email)
     .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // 没有找到邀请人，认定为未注册
        return NextResponse.json({ exists: false });
      } else {
        console.error('Error querying Users table:', userError);
        return NextResponse.json({ message: 'An error occurred while checking the inviter' }, { status: 500 });
      }
    }

    if (user.verification_token !== null) {
      return NextResponse.json({ exists: false });
    }

    // 邮箱已验证，用户已注册
    return NextResponse.json({ exists: true });

  } catch (error) {
    console.error('Error checking inviter email:', error);
    return NextResponse.json({ message: 'An error occurred while checking inviter email' }, { status: 500 });
  }
}