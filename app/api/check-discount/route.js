import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No discount code provided' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .select('discount_percentage')
    .eq('code', code)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 });
  }

  return NextResponse.json({ discountPercentage: data.discount_percentage });
}