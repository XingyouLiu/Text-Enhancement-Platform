import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  let { email } = await req.json();
  
  // 将邮箱转换为小写
  email = email.toLowerCase();

  try {
    // 1. 在 Users 表格中查找用户
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // 用户不存在，创建新用户
        return await createNewUser(email);
      } else {
        // 其他错误
        console.error('Error querying Users table:', userError);
        return NextResponse.json({ message: 'An error occurred while checking the user' }, { status: 500 });
      }
    } else {
      // 用户存在，检查验证状态
      return await checkAndResendVerification(user.id, email);
    }
  } catch (error) {
    console.error('Error in resend verification process:', error);
    return NextResponse.json({ message: 'An error occurred during the verification process' }, { status: 500 });
  }
}

async function checkAndResendVerification(userId, email) {
  // 在 Authentication 中查找用户信息
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError) {
    console.error('Error querying Authentication:', authError);
    return NextResponse.json({ message: 'An error occurred while checking the email' }, { status: 500 });
  }

  if (authUser.user.email_confirmed_at) {
    return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
  }

  // 用户存在但未验证，重新发送验证邮件
  return await resendVerificationEmail(userId, email);
}

async function createNewUser(email) {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  try {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        verification_token: verificationToken,
      }
    });

    if (createError) {
      return NextResponse.json({ message: createError.message }, { status: 400 });
    }

    if (createdUser.user) {
      const { error: userError } = await supabase.from('Users').insert({
        id: createdUser.user.id,
        email: createdUser.user.email,
        tokens: 0,
        verification_token: verificationToken,
      });

      if (userError) {
        await supabase.auth.admin.deleteUser(createdUser.user.id);
        return NextResponse.json({ message: 'Error creating user profile' }, { status: 500 });
      }

      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`;
      await sendCustomVerificationEmail(email, verificationUrl);

      return NextResponse.json({ message: 'User created. Please check your email to verify your account.' });
    }
  } catch (error) {
    console.error('Error during user creation:', error);
    return NextResponse.json({ message: 'An error occurred during user creation' }, { status: 500 });
  }
}

async function resendVerificationEmail(userId, email) {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  try {
    const { error: updateError } = await supabase
      .from('Users')
      .update({ verification_token: verificationToken })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating verification token:', updateError);
      return NextResponse.json({ message: 'Failed to update verification token' }, { status: 500 });
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`;
    await sendCustomVerificationEmail(email, verificationUrl);

    return NextResponse.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json({ message: 'Failed to resend verification email' }, { status: 500 });
  }
}

async function sendCustomVerificationEmail(email, verificationUrl) {
  const messageData = {
    from: 'Best DeAI <postmaster@sandbox1e561dfd8bdc4f48bd94a528073fb5bb.mailgun.org>',
    to: email,
    subject: 'Verify your email address',
    text: `Please click the following link to verify your email address: ${verificationUrl}`,
    html: `<p>Please click the following link to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
  };

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}