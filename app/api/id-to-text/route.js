import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import connectMongo from "@/libs/mongoose";
import Content from '@/models/Content';

export async function GET(request) {
  try {
    // 只使用 connectMongo 来建立连接
    console.log('Connecting to MongoDB...');
    await connectMongo();
    console.log('Connected to MongoDB');

    // 从查询参数中获取文本 ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing ID parameter' }, { status: 400 });
    }

    // 在数据库中查找文本
    console.log('Searching for text with ID:', id);
    const content = await Content.findOne({ _id: new ObjectId(id) });

    if (!content) {
      return NextResponse.json({ message: 'Text not found' }, { status: 404 });
    }

    // 返回找到的文本内容
    return NextResponse.json({ 
      content: content.content,
      contentType: content.contentType
    });

  } catch (error) {
    console.error('Error in GET /api/id-to-text:', error);
    return NextResponse.json({ message: 'Error retrieving text', error: error.toString() }, { status: 500 });
  }
}