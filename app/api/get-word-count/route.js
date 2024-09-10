import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

    const formData = await request.formData();
    const file = formData.get('file');
  

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds 10 MB limit' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    const mammoth = await import('mammoth');
    const extractResult = await mammoth.extractRawText({  
      buffer: buffer,
      options: {
        preserveEmptyParagraphs: true,
      }
    });
    let text = extractResult.value;

    text = text.replace(/\n/g, '\n\n').replace(/\n{3,}/g, '\n\n');

    const words = tokenizer.tokenize(text);
    const wordCount = words.length;

    if (wordCount < 400 || wordCount > 15000) {
      return NextResponse.json({ message: 'Text must be between 400 and 15000 words.' }, { status: 400 });
    }

    const tokensToSpend = Math.round(wordCount);

    return NextResponse.json({ 
      wordCount: wordCount,
      tokensToSpend: tokensToSpend,
      text: text
    });
  } catch (error) {
    console.error('Error in POST /api/get-word-count:', error);
    return NextResponse.json({ message: 'Error processing file', error: error.toString() }, { status: 500 });
  }
}