window.supabaseReady = fetch('/api/config')
  .then((response) => {
    if (!response.ok) throw new Error('Konfigurasi Supabase tidak tersedia.');
    return response.json();
  })
  .then(({ url, anonKey }) => {
    if (!url || !anonKey) throw new Error('SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi.');
    return window.supabase.createClient(url, anonKey);
  });
