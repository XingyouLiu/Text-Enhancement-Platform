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
  const { email, password, invitedBy } = await req.json();

  // 生成验证 token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  try {
    // 直接创建用户
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        verification_token: verificationToken,
      }
    });

    if (createError) {
      return NextResponse.json({ message: createError.message }, { status: 400 });
    }

  // 如果用户创建成功，将信息插入 Users 表
    if (createdUser.user) {
      const { error: userError } = await supabase.from('Users').insert({
        id: createdUser.user.id,
        email: createdUser.user.email,
        tokens: 0,
        invited_by: invitedBy || null,
        verification_token: verificationToken,
      });

      if (userError) {
        // 如果插入 Users 表失败，删除刚刚创建的认证用户
        await supabase.auth.admin.deleteUser(createdUser.user.id);
        return NextResponse.json({ message: 'Error creating user profile' }, { status: 500 });
      }

      // 发送自定义验证邮件
      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`;
      await sendCustomVerificationEmail(email, verificationUrl);

      return NextResponse.json({ message: 'Please check your email to verify your account to finish registration.' });
    }
  } catch (error) {
    console.error('Error during user creation:', error);
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
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
