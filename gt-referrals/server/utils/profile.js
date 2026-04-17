const TAGLINE_MAX_LENGTH = 140;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

export function pickAllowedFields(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );
}

export function normalizeCommonProfileFields(updates) {
  const normalized = { ...updates };

  if (hasOwn(normalized, 'name')) {
    if (typeof normalized.name !== 'string') {
      return { error: 'Name must be a string' };
    }

    const nextName = normalizeWhitespace(normalized.name);
    if (nextName.length < NAME_MIN_LENGTH || nextName.length > NAME_MAX_LENGTH) {
      return { error: `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters` };
    }

    normalized.name = nextName;
  }

  if (hasOwn(normalized, 'tagline')) {
    if (normalized.tagline === null) {
      normalized.tagline = '';
    }

    if (typeof normalized.tagline !== 'string') {
      return { error: 'Tagline must be a string' };
    }

    const nextTagline = normalizeWhitespace(normalized.tagline);
    if (nextTagline.length > TAGLINE_MAX_LENGTH) {
      return { error: `Tagline must be ${TAGLINE_MAX_LENGTH} characters or fewer` };
    }

    if (/[<>]/.test(nextTagline)) {
      return { error: 'Tagline cannot contain HTML characters' };
    }

    normalized.tagline = nextTagline;
  }

  return { updates: normalized };
}

export function normalizeTargetRoles(targetRoles) {
  if (!Array.isArray(targetRoles)) {
    return { error: 'targetRoles must be an array' };
  }

  const nextRoles = targetRoles
    .filter((role) => typeof role === 'string')
    .map((role) => normalizeWhitespace(role))
    .filter(Boolean)
    .slice(0, 15);

  return { roles: nextRoles };
}

export const profileConstraints = {
  TAGLINE_MAX_LENGTH,
};
