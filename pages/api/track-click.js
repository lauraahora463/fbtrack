import dbConnect from '../../lib/db';
import Click from '../../models/Click';
import axios from 'axios';

const DEFAULT_ACCESS_TOKEN = process.env.ACCESS_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();

  const { fbclid, timestamp, landing, pixelId, accessToken, dominio } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'];

  const safeLanding = landing ? landing.replace(/[^a-zA-Z0-9]/g, '') : 'desconocida';
  const event_source_url = `https://${safeLanding}.${dominio}`;

  try {
    console.log('📥 Datos recibidos:', { fbclid, timestamp, landing, pixelId });

    const event = {
      event_name: 'Lead',
      event_time: Math.floor((timestamp || Date.now()) / 1000),
      action_source: 'website',
      event_source_url,
      user_data: {
        client_ip_address: ip,
        client_user_agent: user_agent
      }
    };

    const metaResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken || DEFAULT_ACCESS_TOKEN}`,
      { data: [event] }
    );

    console.log('✅ Evento enviado a Meta:', metaResponse.data);

    const click = await Click.create({
      fbclid,
      timestamp,
      ip,
      user_agent,
      meta_response: metaResponse.data,
      landing,
      dominio
    });

    console.log('💾 Click guardado en base de datos');

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error en track-click:', err.message, err.response?.data || '');
    res.status(500).json({ error: err.message });
  }
}