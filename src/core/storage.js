const STORAGE_KEY = 'rintisusaha_mvp_state_v1';

function loadAppState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Local storage fallback:', error);
    return null;
  }
}

function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Gagal menyimpan ke localStorage:', error);
  }
}
