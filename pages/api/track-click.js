import dbConnect from '../../lib/db';
import Click from '../../models/Click';
import axios from 'axios';
import crypto from 'crypto';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

function hash(data) {
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();
  const { fbclid, phone, timestamp, landing, pixelId } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'];

  try {
    const event = {
      event_name: 'Lead',
      event_time: Math.floor((timestamp || Date.now()) / 1000),
      action_source: 'website',
      event_source_url: 'https://tucasino.com/landing',
      user_data: {
        fbclid,
        ph: phone ? hash(phone) : undefined
      }
    };

    const metaResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${ACCESS_TOKEN}`,
      { data: [event] }
    );

    const click = await Click.create({ fbclid, phone, timestamp, ip, user_agent, meta_response: metaResponse.data, landing });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}