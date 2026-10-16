const categories = ['packaged_food', 'catering', 'salon', 'ambiguous_drink', 'unverified_custom'];
const allowedProfileFields = ['category', 'activityType', 'productDetail', 'productionLocation', 'shelfLife', 'riskIngredient', 'cosmeticUsage', 'businessScale', 'existingPermits'];

function normalizeAnalysis(value) {
  const profilePatch = value.profilePatch && typeof value.profilePatch === 'object'
    ? Object.fromEntries(Object.entries(value.profilePatch).filter(([key, item]) => allowedProfileFields.includes(key) && typeof item === 'string' && item.length <= 500 && (key !== 'category' || categories.includes(item))))
    : null;

  return {
    complete: value.complete === true,
    reply: typeof value.reply === 'string' ? value.reply : 'Aku perlu sedikit detail lagi agar pemetaan usahamu tepat.',
    questions: Array.isArray(value.questions)
      ? value.questions.slice(0, 4).map((item, index) => ({
        id: String(item.id || `ai-question-${index + 1}`),
        question: String(item.question || ''),
        options: Array.isArray(item.options) ? item.options.slice(0, 5).map(String) : []
      })).filter((item) => item.question)
      : [],
    profilePatch: profilePatch && Object.keys(profilePatch).length > 0 ? profilePatch : null
  };
}

function parseModelJson(text) {
  const cleaned = String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Respons Gemini bukan JSON yang valid.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildPrompt(payload) {
  return `Kamu adalah Riri, asisten persiapan legalitas UMK Indonesia. Bantu pengguna dengan bahasa Indonesia yang hangat, singkat, dan tidak mengarang kepastian hukum. Arahkan verifikasi ke OSS, BPOM, BPJPH, atau Dinas terkait bila perlu.

Balas HANYA JSON valid:
{"complete":false,"reply":"...","questions":[{"id":"...","question":"...","options":["..."]}],"profilePatch":{"category":"..."}}

Ajukan satu pertanyaan paling penting per giliran. category harus salah satu dari: ${categories.join(', ')}. Jika informasi sudah cukup, gunakan complete=true dan questions=[]. profilePatch hanya boleh berisi nilai yang benar-benar tersirat.
Profil: ${JSON.stringify(payload.profile || {})}
Percakapan: ${JSON.stringify(payload.messages || [])}
Pesan terbaru: ${JSON.stringify(payload.message || '')}`;
}

async function askGemini(payload) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY belum dikonfigurasi.');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  let lastError = 'Gemini mengembalikan error.';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800));
    const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(payload) }] }] })
    });
    const data = await result.json();
    if (result.ok) return normalizeAnalysis(parseModelJson(data.candidates?.[0]?.content?.parts?.[0]?.text));
    lastError = data.error?.message || lastError;
    if (![429, 503].includes(result.status)) break;
  }
  throw new Error(lastError);
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    response.status(200).json(await askGemini(request.body || {}));
  } catch (error) {
    response.status(502).json({ error: error.message });
  }
};
