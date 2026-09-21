// The backend's `skills` field shape isn't fully pinned down by the spec,
// and in practice shows up nested in more than one way. This normalizes
// any of them into a flat string array + a { categoryName: [skills] } map,
// so components never end up trying to render a raw object as a child.

function isArrayOfStrings(value) {
  return Array.isArray(value);
}

function isCategoryMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const values = Object.values(value);
  return values.length > 0 && values.every((v) => Array.isArray(v));
}

export function normalizeSkills(skills) {
  if (!skills) return { all: [], categories: {} };

  // Shape: skills = ["React", "Python", ...]
  if (isArrayOfStrings(skills)) {
    return { all: skills, categories: {} };
  }

  if (typeof skills !== "object") return { all: [], categories: {} };

  // Shape: skills = { ai_ml: [...], backend: [...], ... } (already a category map)
  if (isCategoryMap(skills)) {
    return { all: Object.values(skills).flat(), categories: skills };
  }

  // Shape: skills = { categorized: {...}, all: [...] } or similar wrapper —
  // look for a nested category map and an optional flat list alongside it.
  let categories = {};
  let flatList = null;

  for (const value of Object.values(skills)) {
    if (isCategoryMap(value) && Object.keys(categories).length === 0) {
      categories = value;
    } else if (isArrayOfStrings(value) && flatList === null) {
      flatList = value;
    }
  }

  return {
    all: flatList ?? Object.values(categories).flat(),
    categories,
  };
}
