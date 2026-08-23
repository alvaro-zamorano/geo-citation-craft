// GET /api/demo?url=dominio.com[&completa=1]
//
// Devuelve la demo de la auditoria de 197 EUR, ya recortada EN EL SERVIDOR. El
// resto no viaja: taparlo con un desenfoque de CSS seria enseñarselo a
// cualquiera que abra el inspector.
//
// Sin ?completa: solo el principio de los tres ficheros. Es lo que pide el
// bloque que sale tras escanear, donde el escaneo ya esta en pantalla y
// repetirlo costaria cinco segundos por nada.
//
// Con ?completa=1: ademas el escaneo recortado (titular, nota, el primer fallo
// de plantilla y las tres peores paginas). Es lo que pide la pagina compartible,
// que llega sin contexto ninguno.
import { construirDemoFicheros, construirDemo } from './_lib/auditoria.mjs';
import { escanear } from './scan.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = req.query || {};
  const dominio = String(q.url || '').trim();
  if (!dominio || !dominio.includes('.')) {
    return res.status(400).json({ error: 'Falta ?url= o el dominio no es válido.' });
  }
  try {
    const datos = q.completa
      ? await construirDemo(dominio, escanear)
      : await construirDemoFicheros(dominio);
    res.status(200).json(datos);
  } catch (e) {
    res.status(500).json({ error: 'No he podido generar la demo', detail: String(e).slice(0, 140) });
  }
}
