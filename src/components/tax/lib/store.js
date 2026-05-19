const KEY = 'ei-tax-v1';

const DEFAULT = {
  trades: [],
  profile: {
    taxNumber: '',
    name: '',
    address: '',
    city: '',
    postCode: '',
    birthDate: '',
    email: '',
    phone: '',
  },
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const data = JSON.parse(raw);
    return { ...DEFAULT, ...data, profile: { ...DEFAULT.profile, ...(data.profile || {}) } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  download(blob, `ei-davek-${new Date().toISOString().slice(0, 10)}.json`);
}

export function importJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data?.trades)) throw new Error('Neveljavna datoteka');
  return { ...DEFAULT, ...data, profile: { ...DEFAULT.profile, ...(data.profile || {}) } };
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
