const connectMongo = require('../libs/mongoose');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const Bull = require('bull');
const axios = require('axios');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const processingQueue = new Bull('processing', {
  redis: { port: 6379, host: '127.0.0.1' }
});
const docConversionQueue = new Bull('docConversion', {
  redis: { port: 6379, host: '127.0.0.1' }
});

const agent = new https.Agent({  
  rejectUnauthorized: false
});

processingQueue.process(async (job) => {
  let connection;
  try {
    connection = await connectMongo();
    const db = connection.connection.db;
    const collection = db.collection('contents');

    const { id } = job.data;
    
    const result = await collection.findOneAndUpdate(
     { _id: new ObjectId(id) },
     { $set: { status: 'processing' } },
     { returnDocument: 'after' }
   );

   const content = result.value;
    
    if (!content) {
      throw new Error('Content not found');
    }

    const response = await axios.post('https://localhost:8000/process_paper', 
      { text: content.content },
      { 
        headers: { 'X-API-Key': process.env.PYTHON_SERVICE_KEY},
        httpsAgent: agent
      }
    );
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          content: response.data.processed_text,
          status: 'processed',
          processedAt: new Date()
        } 
      }
    );

    await docConversionQueue.add({ id: id });
    console.log(`Added processed content ${id} to document conversion queue`);

  } catch (error) {
    console.error('Error processing text:', error);
    throw error;
  }
});

console.log('Text processing worker is running');
