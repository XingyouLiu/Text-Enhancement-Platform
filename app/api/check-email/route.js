import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用环境变量创建 Supabase 客户端
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
        // 没有找到用户，认定为未注册
        return NextResponse.json({ exists: false });
      } else {
        console.error('Error querying Users table:', userError);
        return NextResponse.json({ message: 'An error occurred while checking the email' }, { status: 500 });
      }
    }

    // 检查 verification_token 是否为 NULL
    if (user.verification_token === null) {
      // 邮箱已验证，用户已注册
      return NextResponse.json({ exists: true });
    } else {
      // 邮箱未验证，删除用户信息
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteAuthError) {
        console.error('Error deleting user from Authentication:', deleteAuthError);
      }

      const { error: deleteUserError } = await supabase
        .from('Users')
        .delete()
        .eq('id', user.id);

      if (deleteUserError) {
        console.error('Error deleting user from Users table:', deleteUserError);
      }

      return NextResponse.json({ exists: false });
    }

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ message: 'An error occurred while checking the email' }, { status: 500 });
  }
}