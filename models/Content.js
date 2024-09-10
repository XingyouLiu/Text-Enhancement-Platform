import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
    enum: ['text', 'temp_text'],
  },
  content: String,
  fileKey: String,
  status: {
    type: String,
    enum: ['waiting', 'processing', 'processed', 'uploaded'],
    default: 'waiting'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expireAt: { 
    type: Date, 
    required: false 
  },
  wordCount: {
    type: Number,
    required: function() { return this.contentType !== 'temp_text'; }
  },
  uploadTime: {
    type: Date,
    default: Date.now,
    required: function() { return this.contentType !== 'temp_text'; }
  },
  processedAt: {
    type: Date,
    required: false  
  },
  docExpireAt: {
    type: Date,
    required: false  
  },
  docUrl: {
    type: String,
    required: false  
  },  
}, { timestamps: true });

// 添加 TTL 索引
ContentSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// 如果模型已经编译过，我们需要先删除它
if (mongoose.models.Content) {
  delete mongoose.models.Content;
}

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);