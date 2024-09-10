import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  
  email = email.toLowerCase();

  try {
    const { data: user, error: userError } = await supabase
     .from('Users')
     .select('id, verification_token')
     .eq('email', email)
     .single();

   if (userError) {
     if (userError.code === 'PGRST116') {
       // User not found
       return NextResponse.json({ message: 'User not found' }, { status: 404 });
     } else {
       console.error('Error querying Users table:', userError);
       return NextResponse.json({ message: 'An error occurred while checking the email' }, { status: 500 });
     }
   }

   if (user.verification_token !== null) {
     return NextResponse.json({ message: 'Email not verified' }, { status: 400 });
   }

    // 3. Generate OTP verification link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      }
    });

    if (error) {
      console.error('Error generating magic link:', error);
      return NextResponse.json({ message: 'Error generating magic link' }, { status: 500 });
    }

    if (!data) {
      console.error('No data returned from generateLink');
      return NextResponse.json({ message: 'No data returned when generating magic link' }, { status: 500 });
    }

    // 4. Send magic link using Mailgun
    await sendPasswordResetEmail(email, data.properties.action_link);

    console.log('Magic link sent successfully');

    return NextResponse.json({ message: 'Magic link sent successfully' });
  } catch (error) {
    console.error('Error in magic link generation process:', error);
    return NextResponse.json({ message: 'An error occurred during the magic link generation process' }, { status: 500 });
  }
}

async function sendPasswordResetEmail(email, resetUrl) {
  const messageData = {
    from: 'Text Enhancement <postmaster@sandbox1e561dfd8bdc4f48bd94a528073fb5bb.mailgun.org>',
    to: email,
    subject: 'Reset your password',
    text: `Please click the following link to reset your password: ${resetUrl}`,
    html: `<p>Please click the following link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  };

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}