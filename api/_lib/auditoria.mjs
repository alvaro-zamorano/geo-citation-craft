// Generador del pack de la auditoria de 197 EUR.
//
// Todo lo que hay aqui es DETERMINISTA: sale del HTML y del sitemap del cliente,
// sin modelo de por medio. Esa es la diferencia entre entregar en dos minutos y
// entregar en dos dias, y es lo que convierte la auditoria en un producto.

const UA = { 'user-agent': 'Mozilla/5.0 (compatible; HABLA-audit/2.0; +https://www.esgeo.ai)' };

async function texto(url, ms = 6000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, redirect: 'follow', headers: UA });
    return r.ok ? await r.text() : '';
  } catch { return ''; } finally { clearTimeout(t); }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const limpia = s => String(s || '').replace(/\s+/g, ' ').trim();

const LOC = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/g;
const SALTA = /\.(xml|txt|pdf|jpe?g|png|webp|gif|svg|gz|css|js|ico|zip|mp4)$/i;

// ── Rutas del sitio, desde el sitemap (siguiendo indices) ───────────────────
async function rutas(raiz, limite = 40) {
  const host = raiz.replace(/^https?:\/\//, '');
  let locs = [...(await texto(raiz + '/sitemap.xml')).matchAll(LOC)].map(m => m[1]);
  const hijos = locs.filter(l => /\.xml($|\?)/i.test(l)).slice(0, 5);
  if (hijos.length) {
    const dentro = await Promise.all(hijos.map(h => texto(h)));
    locs = dentro.flatMap(x => [...x.matchAll(LOC)].map(m => m[1]));
  }
  const vistas = new Set(), out = [];
  for (const l of locs) {
    const k = l.replace(/\/+$/, '').replace(/^http:/, 'https:');
    if (vistas.has(k) || !k.includes(host) || SALTA.test(k)) continue;
    vistas.add(k); out.push(k);
    if (out.length >= limite) break;
  }
  return out;
}

const tituloCrudo = html => limpia((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
// El sufijo "| Marca" del title es, casi siempre, el nombre real del negocio.
// Se guarda antes de recortarlo, porque es mejor nombre que el titular de la home.
const marcaDe = html => limpia((tituloCrudo(html).match(/[|·]\s*([^|·]{2,40})\s*$/) || [])[1] || '');
const tituloDe = html => tituloCrudo(html).replace(/\s*[|·]\s*[^|·]{1,40}$/, '');
const descDe = html => limpia((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '');

// ── llms.txt ────────────────────────────────────────────────────────────────
// El formato es el de llmstxt.org: un H1 con el nombre, una cita con el
// resumen, y secciones con enlaces anotados. Se rellena con los titulos y las
// descripciones REALES de cada pagina, no con marcadores.
export async function generarLlmsTxt(raiz) {
  const urls = await rutas(raiz, 40);
  if (!urls.length) return null;
  const paginas = await pool(urls, 6, async u => {
    const h = await texto(u);
    return { url: u, titulo: tituloDe(h) || u.replace(raiz, '').replace(/^\//, '') || 'Inicio', desc: descDe(h), marca: marcaDe(h) };
  });
  const home = paginas.find(p => p.url.replace(/\/+$/, '') === raiz.replace(/\/+$/, '')) || paginas[0];
  const marca = home.marca || (home.titulo || raiz.replace(/^https?:\/\//, '')).split(/[:|]/)[0].trim();
  // Sin este apaño el resumen acaba en ".." cuando la meta description ya trae punto.
  const punto = t => /[.!?]$/.test(String(t).trim()) ? String(t).trim() : String(t).trim() + '.';
  const resto = paginas.filter(p => p !== home);

  const linea = p => `- [${p.titulo}](${p.url})${p.desc ? ': ' + p.desc.slice(0, 160) : ''}`;
  return `# ${marca}

> ${punto(home.desc || 'Sitio web de ' + marca)}

## Páginas principales

${resto.slice(0, 25).map(linea).join('\n')}
${resto.length > 25 ? `\n## Más contenido\n\n${resto.slice(25).map(linea).join('\n')}\n` : ''}
## Sobre este fichero

Generado el ${new Date().toISOString().slice(0, 10)} a partir del sitemap de ${raiz}.
Mantenlo actualizado cuando publiques páginas nuevas: los agentes lo leen para
saber qué hay en el sitio sin tener que rastrearlo entero.
`;
}

// ── robots.txt con directivas para bots de IA ───────────────────────────────
export function generarRobots(raiz) {
  return `# Directivas para rastreadores de IA
# Generado para ${raiz}. Pega esto en tu robots.txt, encima de lo que ya tengas.
#
# Decisión editorial, no técnica: cada bloque dice si dejas que ese agente te
# lea. Si lo bloqueas, no te podrá citar.

# Buscadores con IA: déjalos entrar, es de donde salen las citas
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

# Agentes que navegan por encargo de un usuario
User-agent: ChatGPT-User
Allow: /

User-agent: Perplexity-User
Allow: /

# Entrenamiento de modelos: aquí decides tú. Allow para maximizar presencia,
# Disallow si no quieres que tu contenido entre en el corpus de entrenamiento.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${raiz}/sitemap.xml
`;
}

// ── JSON-LD de identidad ────────────────────────────────────────────────────
// Organization + WebSite. Es lo que permite a un modelo saber QUIEN eres, no
// solo que dices. Se rellena con lo que ya hay en el HTML de la home: nada
// inventado, porque un dato inventado en un JSON-LD es peor que no tenerlo.
export async function generarJsonLd(raiz) {
  const html = await texto(raiz);
  if (!html) return null;
  const meta = (n, a = 'property') => limpia((html.match(new RegExp(`<meta[^>]+${a}=["']${n}["'][^>]+content=["']([^"']*)["']`, 'i')) || [])[1] || '');
  const nombre = marcaDe(html) || meta('og:site_name') || tituloDe(html) || raiz.replace(/^https?:\/\//, '');
  const desc = descDe(html) || meta('og:description');
  const logo = meta('og:image');
  const email = (html.match(/mailto:([^"'?\s>]+)/i) || [])[1] || '';
  const redes = [...new Set([...html.matchAll(/https?:\/\/(?:www\.)?(?:linkedin\.com|x\.com|twitter\.com|instagram\.com|youtube\.com|facebook\.com)\/[^"'\s<>]+/gi)].map(m => m[0].replace(/[),.]+$/, '')))].slice(0, 5);

  const org = {
    '@type': 'Organization',
    '@id': raiz + '/#organizacion',
    name: nombre,
    url: raiz,
    ...(desc ? { description: desc } : {}),
    ...(logo ? { logo } : {}),
    ...(redes.length ? { sameAs: redes } : {}),
    ...(email ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email } } : {})
  };
  const web = {
    '@type': 'WebSite',
    '@id': raiz + '/#web',
    url: raiz,
    name: nombre,
    publisher: { '@id': raiz + '/#organizacion' },
    inLanguage: (html.match(/<html[^>]+lang=["']([^"']+)["']/i) || [])[1] || 'es'
  };
  const faltan = [];
  if (!logo) faltan.push('logo (no hay og:image en la home)');
  if (!email) faltan.push('email de contacto (no hay ningun mailto en la home)');
  if (!redes.length) faltan.push('perfiles sociales (sameAs)');
  if (!desc) faltan.push('descripcion (no hay meta description)');

  return {
    faltan,
    codigo: '<script type="application/ld+json">\n' +
      JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, web] }, null, 2) +
      '\n</script>'
  };
}

// ── El informe ──────────────────────────────────────────────────────────────
// Un solo HTML autocontenido: se abre en cualquier navegador, se imprime a PDF
// y no depende de nosotros para seguir existiendo dentro de dos anos.
export function generarInforme(scan, raiz, ficheros) {
  const hoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const dominio = raiz.replace(/^https?:\/\//, '');
  const color = n => n >= 80 ? '#0c7a51' : n >= 60 ? '#b8791f' : '#c2410c';

  // El plan: primero lo que se repite (una edicion de plantilla arregla N paginas),
  // luego lo de sitio (un fichero), y al final lo puntual de cada pagina.
  const plan = [];
  (scan.repeated_issues || []).forEach(p => plan.push({
    que: p.win, donde: `${p.pages} de ${scan.pages_ok} páginas`,
    por: 'Es de plantilla: lo arreglas una vez y sube todo el sitio.'
  }));
  (scan.site_issues || []).forEach(p => plan.push({
    que: p.win, donde: 'todo el sitio',
    por: 'Vive en un único fichero. Una sola edición.'
  }));
  const sueltas = new Map();
  (scan.pages || []).forEach(pg => (pg.wins || []).forEach(w => {
    if ((scan.repeated_issues || []).some(x => x.win === w)) return;
    if ((scan.site_issues || []).some(x => x.win === w)) return;
    if (!sueltas.has(w)) sueltas.set(w, []);
    sueltas.get(w).push(pg.url);
  }));
  [...sueltas.entries()].slice(0, 12).forEach(([w, urls]) => plan.push({
    que: w, donde: urls.map(u => u.replace(raiz, '') || '/').join(', '),
    por: 'Puntual: solo afecta a esas páginas.'
  }));

  const bloque = (titulo, nombre, contenido, nota) => `
  <section class="f">
    <h3>${esc(titulo)}</h3>
    <p class="ruta">Guárdalo como <code>${esc(nombre)}</code></p>
    ${nota ? `<p class="nota">${nota}</p>` : ''}
    <pre>${esc(contenido)}</pre>
  </section>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auditoría HABLA de ${esc(dominio)}</title>
<style>
:root{--tinta:#14201b;--suave:#4c5a52;--linea:#d9d3c2;--papel:#faf8f3;--verde:#0c7a51}
*{box-sizing:border-box}
body{margin:0;background:var(--papel);color:var(--tinta);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.w{max-width:860px;margin:0 auto;padding:48px 24px 80px}
h1{font-size:30px;line-height:1.2;margin:0 0 6px}
h2{font-size:21px;margin:44px 0 14px;padding-top:22px;border-top:1px solid var(--linea)}
h3{font-size:16px;margin:26px 0 6px}
.meta{color:var(--suave);font-size:14px;margin:0 0 28px}
.nota-cab{background:#fff;border:1px solid var(--linea);border-radius:10px;padding:20px 22px;margin:0 0 28px}
.tit{font-size:20px;font-weight:700;line-height:1.35;margin:0}
.cifras{display:flex;flex-wrap:wrap;gap:26px;margin:22px 0}
.c b{display:block;font-size:30px;line-height:1;font-weight:700}
.c span{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--suave)}
table{width:100%;border-collapse:collapse;font-size:14px;margin:10px 0 0}
th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--suave);font-weight:600;padding:0 0 8px}
td{padding:9px 0;border-top:1px solid var(--linea);vertical-align:top}
td.n{text-align:right;font-weight:700;white-space:nowrap;padding-left:14px}
.u{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--suave);word-break:break-all}
ol.plan{padding-left:20px;margin:10px 0 0}
ol.plan li{margin:0 0 16px}
ol.plan .d{display:block;font-size:13px;color:var(--suave);margin-top:3px}
pre{background:#fff;border:1px solid var(--linea);border-radius:8px;padding:16px;overflow-x:auto;font-size:12.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.ruta{font-size:13px;color:var(--suave);margin:0 0 8px}
.nota{font-size:13.5px;background:#fff8e6;border:1px solid #e8d9a8;border-radius:8px;padding:10px 13px;margin:0 0 10px}
.pie{margin-top:56px;padding-top:20px;border-top:1px solid var(--linea);font-size:13px;color:var(--suave)}
@media print{body{background:#fff}.w{padding:0}pre{white-space:pre-wrap}}
</style></head><body><div class="w">

<h1>Auditoría HABLA de ${esc(dominio)}</h1>
<p class="meta">${hoy} &middot; rubric ${esc(scan.rubric || '2.0')} &middot; ${scan.pages_ok} páginas leídas</p>

<div class="nota-cab"><p class="tit">${esc(scan.headline || '')}</p></div>

<div class="cifras">
  <div class="c"><b style="color:${color(scan.site_score)}">${scan.site_score}</b><span>Media del sitio</span></div>
  <div class="c"><b>${esc(scan.site_grade || '')}</b><span>Nivel</span></div>
  <div class="c"><b>${scan.spread ? scan.spread.min + ' a ' + scan.spread.max : ''}</b><span>De la peor a la mejor</span></div>
  <div class="c"><b>${scan.pages_failing_gate ?? 0}</b><span>Páginas que no se leen</span></div>
</div>

<h2>Qué hacer, y en qué orden</h2>
<ol class="plan">
${plan.slice(0, 18).map(p => `  <li>${esc(p.que)}<span class="d">${esc(p.donde)}. ${esc(p.por)}</span></li>`).join('\n')}
</ol>

<h2>Página por página</h2>
<table><thead><tr><th>Página</th><th style="text-align:right">Nota</th></tr></thead><tbody>
${(scan.pages || []).map(p => `<tr><td class="u">${esc(p.url.replace(/^https?:\/\//, ''))}</td><td class="n" style="color:${color(p.total)}">${p.total}</td></tr>`).join('\n')}
</tbody></table>

<h2>Los ficheros, listos para pegar</h2>
<p>Los tres están generados con los datos reales de ${esc(dominio)}. No son plantillas de ejemplo.</p>
${ficheros.llms ? bloque('Tu llms.txt', 'llms.txt (en la raíz del dominio)', ficheros.llms) : ''}
${ficheros.robots ? bloque('Directivas para rastreadores de IA', 'robots.txt', ficheros.robots, 'Revisa los dos últimos bloques antes de pegarlo: decidir si dejas entrar a los bots de entrenamiento es una decisión tuya, no técnica.') : ''}
${ficheros.jsonld ? bloque('Tu identidad en JSON-LD', 'pegar en el &lt;head&gt; de todas las páginas', ficheros.jsonld.codigo,
  ficheros.jsonld.faltan.length ? 'No he podido rellenar: ' + esc(ficheros.jsonld.faltan.join(', ')) + '. Completa esos campos a mano antes de publicarlo.' : '') : ''}

<h2>Qué mide esta nota y qué no</h2>
<p>${esc(scan.caveat || 'HABLA mide si una máquina puede leerte y extraer una afirmación citable. No mide autoridad: eso no se marca, se gana. Una nota alta no compra citas, elimina el motivo técnico por el que hoy no te citan.')}</p>

<p class="pie">Auditoría generada por esGEO el ${hoy} sobre ${esc(raiz)}.<br>
Vuelve a pasar el auditor gratuito en <a href="https://www.esgeo.ai/geo-score">esgeo.ai/geo-score</a> cuando apliques los cambios: esa es tu prueba del antes y el después.</p>

</div></body></html>`;
}

// ── El pack completo ────────────────────────────────────────────────────────
// Esto es lo que recibe quien paga los 197 EUR, y llega solo. Antes esta entrega
// empezaba con un email nuestro preguntando "que web quieres que audite".
export async function construirPack(dominioCrudo, email, escanear) {
  const raiz = 'https://' + String(dominioCrudo || '').trim()
    .replace(/^https?:\/\//, '').replace(/\/+$/, '').split('/')[0];

  const { out: scan } = await escanear(raiz, 12);
  if (!scan || !scan.pages_ok) throw new Error('no se pudo leer ninguna página de ' + raiz);

  const [llms, jsonld] = await Promise.all([
    generarLlmsTxt(raiz).catch(() => null),
    generarJsonLd(raiz).catch(() => null)
  ]);
  const robots = generarRobots(raiz);
  const informe = generarInforme(scan, raiz, { llms, robots, jsonld });
  const dominio = raiz.replace(/^https?:\/\//, '');
  const b64 = s => Buffer.from(s, 'utf8').toString('base64');

  const adjuntos = [
    { filename: `auditoria-${dominio}.html`, content: b64(informe) },
    { filename: 'robots.txt', content: b64(robots) }
  ];
  if (llms) adjuntos.push({ filename: 'llms.txt', content: b64(llms) });
  if (jsonld) adjuntos.push({ filename: 'identidad.jsonld.html', content: b64(jsonld.codigo) });

  const primero = (scan.repeated_issues || [])[0];
  const text = `Tu auditoría de ${dominio} ya está lista. Va adjunta a este email.

He leído ${scan.pages_ok} páginas de tu sitio con el mismo auditor que tienes
en esgeo.ai/geo-score. Media: ${scan.site_score} sobre 100 (${scan.site_grade}).
De la peor a la mejor: ${scan.spread.min} a ${scan.spread.max}.

${scan.headline}

${primero ? `Empieza por ahí: al ser un fallo de plantilla, lo arreglas una vez y
suben ${primero.pages} páginas de golpe. El orden completo está en el informe.` : ''}

En los adjuntos encontrarás, además del informe:

- llms.txt, redactado con los títulos y descripciones reales de tus páginas
- robots.txt con las directivas para los rastreadores de IA
- Tu identidad en JSON-LD, lista para pegar en el head

Los tres están generados con los datos de tu web. No son plantillas de ejemplo.

Cuando apliques los cambios, vuelve a pasar el auditor gratuito en
esgeo.ai/geo-score: esa es tu prueba del antes y el después.

Si algo no te cuadra, contesta a este email y te leo yo.

Eric
hola@esgeo.ai`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.55;font-size:15px;max-width:560px;margin:24px auto;padding:0 20px;">
<p>Tu auditoría de <strong>${esc(dominio)}</strong> ya está lista. Va adjunta a este email.</p>
<p>He leído <strong>${scan.pages_ok} páginas</strong> de tu sitio con el mismo auditor que tienes en esgeo.ai/geo-score. Media: <strong>${scan.site_score} sobre 100</strong> (${esc(scan.site_grade)}). De la peor a la mejor: ${scan.spread.min} a ${scan.spread.max}.</p>
<p style="background:#f5f1e8;border-left:3px solid #0c7a51;padding:12px 16px;margin:20px 0;"><strong>${esc(scan.headline)}</strong></p>
${primero ? `<p>Empieza por ahí: al ser un fallo de plantilla, lo arreglas una vez y suben ${primero.pages} páginas de golpe. El orden completo está en el informe.</p>` : ''}
<p>En los adjuntos tienes, además del informe:</p>
<ul style="padding-left:20px;color:#374151;">
<li><code>llms.txt</code>, redactado con los títulos y descripciones reales de tus páginas</li>
<li><code>robots.txt</code> con las directivas para los rastreadores de IA</li>
<li>Tu identidad en <code>JSON-LD</code>, lista para pegar en el head</li>
</ul>
<p>Los tres están generados con los datos de tu web. No son plantillas de ejemplo.</p>
<p>Cuando apliques los cambios, vuelve a pasar el auditor gratuito en <a href="https://www.esgeo.ai/geo-score" style="color:#0c7a51;">esgeo.ai/geo-score</a>: esa es tu prueba del antes y el después.</p>
<p>Si algo no te cuadra, contesta a este email y te leo yo.</p>
<p>Eric<br><a href="mailto:hola@esgeo.ai" style="color:#0c7a51;">hola@esgeo.ai</a></p>
</body></html>`;

  return { dominio, raiz, scan, informe, adjuntos, html, text };
}

// ── La demo ─────────────────────────────────────────────────────────────────
// Un aperitivo del pack, servido ya recortado.
//
// El corte se hace AQUI, en el servidor, y no con un desenfoque de CSS: si
// mandaramos el informe entero y lo tapasemos, cualquiera lo lee con el
// inspector en diez segundos. Lo que no se ha pagado no viaja por el cable.
//
// Que se ve y por que: el titular y la nota (el gancho), el primer fallo de
// plantilla entero (la prueba de que el diagnostico es suyo y es real), y las
// primeras lineas de SUS ficheros ya generados (la prueba de que existen). Lo
// que se corta es el volumen. Ver doce lineas de tu propio llms.txt bien
// escrito convence mas que cualquier parrafo prometiendolo.
const asoma = (texto, lineas) => {
  const todas = String(texto || '').split('\n');
  return {
    muestra: todas.slice(0, lineas).join('\n'),
    total: todas.length,
    ocultas: Math.max(0, todas.length - lineas)
  };
};

export async function construirDemo(dominioCrudo, escanear) {
  const raiz = 'https://' + String(dominioCrudo || '').trim()
    .replace(/^https?:\/\//, '').replace(/\/+$/, '').split('/')[0];

  const { out: scan } = await escanear(raiz, 12);
  if (!scan || !scan.pages_ok) throw new Error('no se pudo leer ninguna página de ' + raiz);

  const [llms, jsonld] = await Promise.all([
    generarLlmsTxt(raiz).catch(() => null),
    generarJsonLd(raiz).catch(() => null)
  ]);
  const robots = generarRobots(raiz);

  const repetidos = scan.repeated_issues || [];
  const paginas = scan.pages || [];

  return {
    dominio: raiz.replace(/^https?:\/\//, ''),
    raiz,
    headline: scan.headline,
    site_score: scan.site_score,
    site_grade: scan.site_grade,
    spread: scan.spread,
    pages_ok: scan.pages_ok,
    pages_failing_gate: scan.pages_failing_gate,
    primer_fallo: repetidos[0] || null,
    fallos_ocultos: Math.max(0, repetidos.length - 1),
    peores: paginas.slice(0, 3).map(p => ({ url: p.url, total: p.total, grade: p.grade })),
    paginas_ocultas: Math.max(0, paginas.length - 3),
    ficheros: {
      llms: llms ? asoma(llms, 12) : null,
      robots: asoma(robots, 14),
      jsonld: jsonld ? { ...asoma(jsonld.codigo, 12), faltan: jsonld.faltan.length } : null
    }
  };
}

// Solo los ficheros, ya recortados. Es lo que pide la demo cuando el cliente
// acaba de escanear: la parte del escaneo ya la tiene en pantalla y volver a
// lanzarlo costaria otros cinco segundos por nada.
export async function construirDemoFicheros(dominioCrudo) {
  const raiz = 'https://' + String(dominioCrudo || '').trim()
    .replace(/^https?:\/\//, '').replace(/\/+$/, '').split('/')[0];
  const [llms, jsonld] = await Promise.all([
    generarLlmsTxt(raiz).catch(() => null),
    generarJsonLd(raiz).catch(() => null)
  ]);
  const robots = generarRobots(raiz);
  return {
    dominio: raiz.replace(/^https?:\/\//, ''),
    llms: llms ? asoma(llms, 12) : null,
    robots: asoma(robots, 14),
    jsonld: jsonld ? { ...asoma(jsonld.codigo, 12), faltan: jsonld.faltan.length } : null
  };
}
