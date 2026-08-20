// GET /api/demo?url=dominio.com
//
// Devuelve las primeras lineas de los tres ficheros que genera la auditoria de
// 197 EUR, ya recortadas en el servidor. El resto no viaja: taparlo con un
// desenfoque de CSS seria enseñarselo a cualquiera que abra el inspector.
//
// No repite el escaneo a proposito. Quien llega aqui acaba de escanear y ya
// tiene esa parte en pantalla; volver a lanzarlo costaria cinco segundos por nada.
import { construirDemoFicheros } from './_lib/auditoria.mjs';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const dominio = String((req.query || {}).url || '').trim();
  if (!dominio || !dominio.includes('.')) {
    return res.status(400).json({ error: 'Falta ?url= o el dominio no es válido.' });
  }
  try {
    res.status(200).json(await construirDemoFicheros(dominio));
  } catch (e) {
    res.status(500).json({ error: 'No he podido generar la demo', detail: String(e).slice(0, 140) });
  }
}
