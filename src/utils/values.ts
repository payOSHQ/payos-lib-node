import { PayOSError } from '../core/error';

// https://stackoverflow.com/a/34491287
export function isEmptyObj(obj: object | null | undefined): boolean {
  if (!obj) {
    return true;
  }
  for (const _k in obj) {
    return false;
  }
  return true;
}

// https://eslint.org/docs/latest/rules/no-prototype-builtins
export function hasOwn<T extends object = object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isObj(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export const safeJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return undefined;
  }
};

export const validatePositiveInteger = (name: string, n: unknown): number => {
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new PayOSError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new PayOSError(`${name} must be a positive integer`);
  }
  return n;
};
