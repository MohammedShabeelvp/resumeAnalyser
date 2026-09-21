export function savePendingAnalysis(data) {
  localStorage.setItem(
    "pendingAnalysis",
    JSON.stringify({
      data,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    })
  );
}

export function getPendingAnalysis() {
  try {
    const raw = localStorage.getItem("pendingAnalysis");
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem("pendingAnalysis");
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem("pendingAnalysis");
    return null;
  }
}

export function clearPendingAnalysis() {
  localStorage.removeItem("pendingAnalysis");
}

export const session = {
  set: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    try {
      const v = sessionStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  remove: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};
