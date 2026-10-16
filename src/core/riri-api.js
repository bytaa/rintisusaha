async function requestRiriAnalysis(payload) {
  const response = await fetch('/api/riri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Riri belum dapat terhubung ke Gemini.');
  }

  return data;
}
