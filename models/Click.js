import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
  fbclid: String,
  timestamp: Number,
  ip: String,
  user_agent: String,
  meta_response: Object,
  landing: String,
  dominio: String,
}, { timestamps: true });

export default mongoose.models.Click || mongoose.model('Click', ClickSchema);