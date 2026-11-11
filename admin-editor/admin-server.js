const http = require('node:http');
const { execFile } = require('node:child_process');
const { readFile } = require('node:fs/promises');
const { isAbsolute, join } = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.ADMIN_EDITOR_PORT || 4177);
const OWNER = 'informaticon2025-creator';
const REPO = 'LearnCPNB';
const BRANCH = 'main';
const GITHUB_API = 'https://api.github.com';
const ADMIN_DIR = __dirname;
const MAX_BODY_BYTES = 1024 * 1024;
const catalogs = {
  news: { label: 'Noticias', directory: 'file/news', prefix: 'new' },
  promotions: { label: 'Promociones', directory: 'file/news', prefix: 'promo' },
  laws: { label: 'Leyes', directory: 'file/gacetas', prefix: 'ley' },
  functions: { label: 'Funciones', directory: 'file/funcion', prefix: 'fuc' }
};

let githubToken = null;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(value));
}

function assertLocalRequest(request) {
  const host = request.headers.host;
  if (host !== `${HOST}:${PORT}` && host !== `localhost:${PORT}`) {
    throw new HttpError(403, 'Solo se aceptan conexiones locales.');
  }

  const origin = request.headers.origin;
  if (request.method !== 'GET' && request.url.startsWith('/api/') && !origin) {
    throw new HttpError(403, 'La solicitud debe originarse en este editor local.');
  }
  if (origin && origin !== `http://${host}`) {
    throw new HttpError(403, 'La solicitud debe originarse en este editor local.');
  }
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'El contenido supera el límite permitido.');
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'La solicitud no contiene JSON válido.');
  }
}

function getCatalog(type) {
  const catalog = catalogs[type];
  if (!catalog) throw new HttpError(400, 'Selecciona una colección válida.');
  return catalog;
}

function getResourcePattern(catalog) {
  return new RegExp(`^${catalog.directory}/${catalog.prefix}_(\\d{2,})\\.json$`);
}

function getResourceNumber(path, catalog) {
  const match = getResourcePattern(catalog).exec(path);
  if (!match) throw new HttpError(400, 'La ruta del archivo no pertenece a esta colección.');
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1 || number > 999) {
    throw new HttpError(400, 'El número del archivo debe estar entre 1 y 999.');
  }
  return number;
}

function resourcePath(catalog, number) {
  return `${catalog.directory}/${catalog.prefix}_${String(number).padStart(2, '0')}.json`;
}

function isValidDate(value) {
  if (typeof value !== 'string') return false;
  const dayFirst = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dayFirst && !iso) return false;
  const year = Number(dayFirst ? dayFirst[3] : iso[1]);
  const month = Number(dayFirst ? dayFirst[2] : iso[2]);
  const day = Number(dayFirst ? dayFirst[1] : iso[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function validateResource(type, item, number) {
  const fail = message => {
    throw new HttpError(400, `${catalogs[type].label} ${number}: ${message}`);
  };
  if (!item || Array.isArray(item) || typeof item !== 'object') {
    fail('el archivo debe contener un objeto JSON.');
  }

  if (type === 'news') {
    if (
      ['titulo', 'fecha', 'descripcion'].some(key => typeof item[key] !== 'string') ||
      isValidDate(item.fecha) === false ||
      (item.img !== undefined && typeof item.img !== 'string') ||
      (item.iframe !== undefined && typeof item.iframe !== 'string') ||
      (!item.img?.trim() && !item.iframe?.trim()) ||
      (item.link !== undefined && typeof item.link !== 'string') ||
      (item.contenido !== undefined && typeof item.contenido !== 'string')
    ) {
      fail('incluye titulo, fecha válida, descripcion y una URL en img (imagen) o iframe (video).');
    }
    return;
  }

  if (type === 'promotions') {
    if (
      ['titulo', 'descripcion', 'enlace', 'textoBoton'].some(key => typeof item[key] !== 'string') ||
      (item.fecha !== undefined && !isValidDate(item.fecha))
    ) {
      fail('incluye titulo, descripcion, enlace y textoBoton; fecha es opcional.');
    }
    return;
  }

  if (type === 'laws') {
    if (
      ['titulo', 'subtitulo', 'descripcion'].some(key => typeof item[key] !== 'string' || !item[key].trim()) ||
      !Array.isArray(item.articulos) ||
      item.articulos.some(article =>
        !article ||
        ['number', 'title', 'text'].some(key => typeof article[key] !== 'string')
      )
    ) {
      fail('incluye titulo, subtitulo, descripcion y una lista articulos con number, title y text.');
    }
    return;
  }

  const allowedTypes = ['claves', 'documento', 'actas', 'procedimiento', 'updf', 'updfm'];
  const categoriesAreValid = Array.isArray(item.categoria) &&
    item.categoria.every(category =>
      category &&
      typeof category.nombre === 'string' &&
      Array.isArray(category.subcategorias) &&
      category.subcategorias.every(subcategory =>
        subcategory &&
        typeof subcategory.nombre === 'string' &&
        Array.isArray(subcategory.articulos) &&
        subcategory.articulos.every(article =>
          article &&
          typeof article.numART === 'string' &&
          typeof article.tituloART === 'string' &&
          typeof article.parrafoART === 'string' &&
          (article.imgART === undefined || typeof article.imgART === 'string')
        )
      )
    );
  if (
    typeof item.titulo !== 'string' || !item.titulo.trim() ||
    typeof item.num !== 'string' || !item.num.trim() ||
    !allowedTypes.includes(item.tipo) ||
    !categoriesAreValid
  ) {
    fail('incluye titulo, num, tipo permitido y categoria con subcategorias y articulos.');
  }
}

function requireToken() {
  if (!githubToken) throw new HttpError(401, 'Conecta primero una cuenta de GitHub.');
}

function encodedPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function githubRequest(path, options = {}) {
  requireToken();
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const status = response.status === 409 ? 409 : response.status === 404 ? 404 : 502;
    const details = response.status === 403
      ? 'GitHub rechazó el acceso. Comprueba que el token tenga permiso Contents: Read and write.'
      : response.status === 404
        ? 'No se encontró el repositorio o archivo. Comprueba que el token tenga acceso.'
        : response.status === 409
          ? 'El archivo cambió en GitHub desde que lo abriste. Recarga el contenido antes de guardar.'
          : `GitHub respondió ${response.status}: ${body.message || 'error inesperado'}`;
    throw new HttpError(status, details);
  }
  return body;
}

async function listFiles(type) {
  const catalog = getCatalog(type);
  const directory = await githubRequest(
    `/repos/${OWNER}/${REPO}/contents/${encodedPath(catalog.directory)}?ref=${encodeURIComponent(BRANCH)}`
  );
  if (!Array.isArray(directory)) throw new HttpError(502, 'GitHub no devolvió una lista de archivos.');
  const pattern = new RegExp(`^${catalog.prefix}_(\\d{2,})\\.json$`);
  return directory
    .filter(file => file.type === 'file' && pattern.test(file.name))
    .map(file => ({
      number: Number(pattern.exec(file.name)[1]),
      path: `${catalog.directory}/${file.name}`,
      sha: file.sha
    }))
    .sort((first, second) => first.number - second.number);
}

async function getResources(type) {
  const files = await listFiles(type);
  const resources = await Promise.all(files.map(async file => {
    const result = await githubRequest(
      `/repos/${OWNER}/${REPO}/contents/${encodedPath(file.path)}?ref=${encodeURIComponent(BRANCH)}`
    );
    if (result.encoding !== 'base64' || typeof result.content !== 'string') {
      throw new HttpError(502, `GitHub no entregó el contenido de ${file.path} en formato esperado.`);
    }
    const content = Buffer.from(result.content.replace(/\s/g, ''), 'base64').toString('utf8');
    try {
      return { ...file, content: JSON.stringify(JSON.parse(content), null, 2) };
    } catch {
      throw new HttpError(502, `${file.path} contiene JSON inválido y no puede abrirse en el editor.`);
    }
  }));
  return resources;
}

async function saveResource(body) {
  const catalog = getCatalog(body.type);
  if (typeof body.content !== 'string' || body.content.length > MAX_BODY_BYTES) {
    throw new HttpError(400, 'El contenido debe ser texto JSON y no superar 1 MB.');
  }
  const number = getResourceNumber(body.path, catalog);
  let parsed;
  try {
    parsed = JSON.parse(body.content);
  } catch {
    throw new HttpError(400, 'El contenido no es JSON válido; revisa comas, comillas y llaves.');
  }
  validateResource(body.type, parsed, number);

  const files = await listFiles(body.type);
  const existing = files.find(file => file.path === body.path);
  if (existing) {
    if (typeof body.sha !== 'string' || body.sha !== existing.sha) {
      throw new HttpError(409, 'El archivo cambió en GitHub desde que lo abriste. Recarga el contenido antes de guardar.');
    }
  } else {
    const expectedNumber = (files.at(-1)?.number || 0) + 1;
    if (number !== expectedNumber || body.sha !== null) {
      throw new HttpError(409, `El siguiente archivo disponible es ${resourcePath(catalog, expectedNumber)}.`);
    }
  }

  const payload = {
    message: typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 120)
      : `Editar ${catalog.label.toLowerCase()} desde el editor local`,
    content: Buffer.from(`${JSON.stringify(parsed, null, 2)}\n`, 'utf8').toString('base64'),
    branch: BRANCH,
    ...(existing ? { sha: existing.sha } : {})
  };
  const result = await githubRequest(
    `/repos/${OWNER}/${REPO}/contents/${encodedPath(body.path)}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return {
    path: body.path,
    sha: result.content?.sha,
    commit: result.commit?.html_url
  };
}

async function deleteLastResource(body) {
  const catalog = getCatalog(body.type);
  const number = getResourceNumber(body.path, catalog);
  const files = await listFiles(body.type);
  const last = files.at(-1);
  if (!last || last.path !== body.path) {
    throw new HttpError(400, 'Solo se permite eliminar el último archivo para no romper la numeración de la colección.');
  }
  if (typeof body.sha !== 'string' || body.sha !== last.sha) {
    throw new HttpError(409, 'El archivo cambió en GitHub. Recarga el contenido antes de eliminarlo.');
  }
  const result = await githubRequest(
    `/repos/${OWNER}/${REPO}/contents/${encodedPath(body.path)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Eliminar ${catalog.label.toLowerCase()} ${number} desde el editor local`,
        sha: last.sha,
        branch: BRANCH
      })
    }
  );
  return { path: body.path, commit: result.commit?.html_url };
}

async function serveStatic(pathname, response) {
  const files = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/admin.css': 'admin.css',
    '/admin.js': 'admin.js',
    '/icon.png': join(ADMIN_DIR, '..', 'icon.png'),
    '/source.png': join(ADMIN_DIR, '..', 'source.png')
  };
  const filename = files[pathname];
  if (!filename) throw new HttpError(404, 'No se encontró esa página.');
  const body = await readFile(isAbsolute(filename) ? filename : join(ADMIN_DIR, filename));
  const contentType = filename.endsWith('.css')
    ? 'text/css; charset=utf-8'
    : filename.endsWith('.js')
      ? 'text/javascript; charset=utf-8'
      : filename.endsWith('.png')
        ? 'image/png'
      : 'text/html; charset=utf-8';
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; connect-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'"
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    assertLocalRequest(request);
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/status') {
        return sendJson(response, 200, { connected: Boolean(githubToken), owner: OWNER, repo: REPO, branch: BRANCH });
      }
      if (url.pathname === '/api/resources') {
        requireToken();
        return sendJson(response, 200, { resources: await getResources(url.searchParams.get('type')) });
      }
      throw new HttpError(404, 'No se encontró esa operación.');
    }

    if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
      const body = await readJsonBody(request);
      if (url.pathname === '/api/connect') {
        const token = typeof body.token === 'string' ? body.token.trim() : '';
        if (!token || token.length > 500) throw new HttpError(400, 'Pega un token de GitHub válido.');
        const previousToken = githubToken;
        githubToken = token;
        try {
          await githubRequest(`/repos/${OWNER}/${REPO}`);
        } catch (error) {
          githubToken = previousToken;
          throw error;
        }
        return sendJson(response, 200, { connected: true, owner: OWNER, repo: REPO, branch: BRANCH });
      }
      if (url.pathname === '/api/disconnect') {
        githubToken = null;
        return sendJson(response, 200, { connected: false });
      }
      if (url.pathname === '/api/save') {
        requireToken();
        return sendJson(response, 200, { saved: await saveResource(body) });
      }
      if (url.pathname === '/api/delete') {
        requireToken();
        return sendJson(response, 200, { deleted: await deleteLastResource(body) });
      }
      throw new HttpError(404, 'No se encontró esa operación.');
    }

    if (request.method === 'GET') return await serveStatic(url.pathname, response);
    throw new HttpError(405, 'Método no permitido.');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : 'Error interno del editor.';
    if (status === 500) console.error(error);
    if (!response.headersSent) sendJson(response, status, { error: message });
    else response.destroy();
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está ocupado. Cierra otra instancia del editor e inténtalo de nuevo.`);
  } else {
    console.error('No se pudo iniciar el editor local.', error);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const address = `http://${HOST}:${PORT}/`;
  console.log(`Servidor en Operacion: ${address}`);
  console.log('El token solo se conserva en memoria mientras el editor está abierto.');
  if (process.env.NO_OPEN_BROWSER !== '1') {
    setTimeout(() => {
      execFile('rundll32.exe', ['url.dll,FileProtocolHandler', address], error => {
        if (error) console.log(`Abre esta dirección en tu navegador: ${address}`);
      });
    }, 500);
  }
});
