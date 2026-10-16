const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

loadEnvFile(path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ROOT = path.join(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) request.destroy(new Error('Request too large'));
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function extractJson(text) {
  const cleaned = String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Respons Gemini bukan JSON yang valid.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeAnalysis(value) {
  const categories = ['packaged_food', 'catering', 'salon', 'ambiguous_drink', 'unverified_custom'];
  const allowedProfileFields = ['category', 'activityType', 'productDetail', 'productionLocation', 'shelfLife', 'riskIngredient', 'cosmeticUsage', 'businessScale', 'existingPermits'];
  const profilePatch = value.profilePatch && typeof value.profilePatch === 'object'
    ? Object.fromEntries(Object.entries(value.profilePatch).filter(([key, item]) => allowedProfileFields.includes(key) && typeof item === 'string' && item.length <= 500 && (key !== 'category' || categories.includes(item))))
    : null;
  return {
    complete: value.complete === true,
    reply: typeof value.reply === 'string' ? value.reply : 'Aku perlu sedikit detail lagi agar pemetaan usahamu tepat.',
    questions: Array.isArray(value.questions) ? value.questions.slice(0, 4).map((item, index) => ({
      id: String(item.id || `ai-question-${index + 1}`),
      question: String(item.question || ''),
      options: Array.isArray(item.options) ? item.options.slice(0, 5).map(String) : []
    })).filter((item) => item.question) : [],
    profilePatch: profilePatch && Object.keys(profilePatch).length > 0 ? profilePatch : null
  };
}

async function askGemini(payload) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env.');
  }

  const prompt = `Kamu adalah Riri, asisten persiapan legalitas UMK Indonesia. Bantu pengguna dengan bahasa Indonesia yang hangat, singkat, dan tidak mengarang kepastian hukum. Gunakan konteks profil dan percakapan berikut untuk menentukan pertanyaan lanjutan yang paling informatif. Jangan memberi keputusan legal final; arahkan verifikasi ke OSS/BPOM/BPJPH/Dinas terkait bila perlu.

Balas HANYA JSON valid dengan bentuk:
{"complete":false,"reply":"...","questions":[{"id":"...","question":"...","options":["..."]}],"profilePatch":{"category":"...","activityType":"...","productionLocation":"...","shelfLife":"..."}}

Ajukan satu pertanyaan paling penting per giliran. Gunakan nilai category persis salah satu packaged_food, catering, salon, ambiguous_drink, unverified_custom. Untuk field lainnya, pertahankan nilai profil kecuali ada konfirmasi jelas. Jika informasi sudah cukup dan tidak ada pertanyaan lanjutan, tetapkan complete=true dan questions=[]. Akhiri reply dengan ringkasan singkat dan beri tahu pengguna bahwa peta legalitas akan dibuka. Jika masih perlu klarifikasi, complete=false dan isi questions. Jangan menganggap nilai bawaan profil sebagai informasi yang sudah dikonfirmasi pengguna. Jangan menutup percakapan hanya karena pengguna mengatakan selesai jika informasi penting belum tersedia. profilePatch hanya boleh berisi nilai yang benar-benar tersirat dari cerita. Profil saat ini: ${JSON.stringify(payload.profile || {})}
Percakapan: ${JSON.stringify(payload.messages || [])}
Pesan terbaru: ${JSON.stringify(payload.message || '')}`;

  let lastError = 'Gemini mengembalikan error.';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return normalizeAnalysis(extractJson(text));
    }

    lastError = data.error?.message || lastError;
    if (![429, 503].includes(response.status)) break;
  }

  throw new Error(lastError);
}

function serveStatic(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const requested = pathname === '/' ? '/rintisusaha-mvp.html' : pathname;
  const publicFile = requested === '/rintisusaha-mvp.html' || /^\/(assets|src)\/[a-zA-Z0-9_./-]+\.(css|js|jsx|jpg|jpeg|png|svg|webp)$/.test(requested);
  if (!publicFile || requested.includes('..')) {
    response.writeHead(404); response.end('Not found'); return;
  }
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  const extension = path.extname(filePath);
  const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jsx': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
  response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/config') {
    sendJson(response, 200, {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || ''
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/riri') {
    try {
      const payload = await readJson(request);
      sendJson(response, 200, await askGemini(payload));
    } catch (error) {
      sendJson(response, 502, { error: error.message });
    }
    return;
  }
  serveStatic(request, response);
});

server.listen(PORT, () => console.log(`RintisUsaha berjalan di http://localhost:${PORT}`));
