const Bull = require('bull');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types; 
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const docx = require('docx');
require('dotenv').config({ path: '.env.local' });
const connectMongo = require('../libs/mongoose');

const docConversionQueue = new Bull('docConversion', {
  redis: { port: 6379, host: '127.0.0.1' }
});

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

docConversionQueue.process(async (job) => {
  try {
    await connectMongo(); 
    const db = mongoose.connection.db;
    const collection = db.collection('contents');

    const { id } = job.data;
    
    const content = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    console.log('Processing text content from MongoDB');

    const paragraphs = content.content.split(/\n\s*\n/);

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: paragraphs.map(paragraph => 
          new docx.Paragraph({
            children: [new docx.TextRun(paragraph.trim())],
            spacing: {
              after: 240, 
            },
          })
        ),
      }],
    });

    const buffer = await docx.Packer.toBuffer(doc);

    const key = `${id}.docx`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    await s3Client.send(command);

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, getCommand, { 
      expiresIn: 259200,
      ResponseContentDisposition: 'attachment; filename="document.docx"'
    });

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'uploaded',
          docUrl: url,
          docExpireAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
        } 
      }
    );

    console.log(`Document converted and uploaded for content id: ${id}`);
  } catch (error) {
    console.error('Error in doc conversion worker:', error);
    throw error;
  }
});

console.log('Document conversion worker is running');
