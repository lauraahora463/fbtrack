import dbConnect from '../../lib/db';
import Click from '../../models/Click';

export default async function handler(req, res) {
  await dbConnect();

  const { start, end } = req.query;
  console.log('Parámetros recibidos del frontend:', { start, end });

  // Convertimos las fechas a objetos Date
  const startDate = start ? new Date(start) : new Date();
  const endDate = end ? new Date(end) : new Date(startDate);

  // Convertimos las fechas a UTC (MongoDB las guarda en UTC)
  const startDateUTC = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0));
  const endDateUTC = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999));

  console.log('Fechas convertidas a UTC:', { startDateUTC, endDateUTC });

  // Realizamos la consulta a la base de datos filtrando por fecha
  const clicks = await Click.find({
    createdAt: {
      $gte: new Date(startDateUTC),
      $lte: new Date(endDateUTC)
    }
  })
    .sort({ createdAt: -1 })
    .limit(500);

  res.json(clicks);
}