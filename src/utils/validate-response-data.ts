import { InvalidSignatureError } from '../core/error';

const KEY_PATTERN = /^[A-Za-z0-9_]+$/;
// A `&key=` sequence inside a value is what lets the unencoded signed string be re-split into other fields.
const SMUGGLING_PATTERN = /&[A-Za-z0-9_]+=/;

const invalid = (reason: string) => new InvalidSignatureError(`Invalid response data: ${reason}`);

const validateScalar = (path: string, value: unknown): void => {
  if (value === null) {
    return;
  }
  if (typeof value === 'string') {
    if (SMUGGLING_PATTERN.test(value)) {
      throw invalid(`"${path}" must not contain a "&key=" sequence`);
    }
  } else if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
      throw invalid(`"${path}" must be a finite number within the safe integer range`);
    }
  } else if (typeof value !== 'boolean') {
    throw invalid(`"${path}" has an unsupported type`);
  }
};

const validateKeys = (path: string, record: Record<string, unknown>): void => {
  for (const key of Object.keys(record)) {
    // `__proto__` matches the key pattern, but assigning it while sorting the keys is a no-op,
    // which would leave the field out of the signed string.
    if (!KEY_PATTERN.test(key) || key === '__proto__') {
      throw invalid(`unsupported key "${path}${key}"`);
    }
  }
};

/**
 * Validates the shape of a response `data` object before its body signature is verified.
 *
 * The body signature is computed over `key=value` pairs joined by `&` without any encoding, with
 * arrays serialised as JSON and `null`/`'null'`/`'undefined'` collapsed to an empty string. The
 * received data must therefore not be able to shift delimiters, replace a scalar with an object, or
 * turn an array into a string that swallows the remaining fields.
 *
 * Top level values may be scalars (string without a `&key=` sequence, finite number, boolean, null) or arrays of
 * plain objects/scalars. Nested plain objects are only accepted inside arrays and may only contain scalars.
 *
 * @param data - The `data` field of an API response signed with the `body` signature.
 * @throws {InvalidSignatureError} When the data does not have the expected shape.
 */
export const validateResponseData = function (data: unknown): void {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw invalid('data must be a JSON object');
  }

  const record = data as Record<string, unknown>;
  validateKeys('', record);

  for (const key of Object.keys(record)) {
    const value = record[key];
    if (!Array.isArray(value)) {
      validateScalar(key, value);
      continue;
    }
    value.forEach((item, index) => {
      const path = `${key}[${index}]`;
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entry = item as Record<string, unknown>;
        validateKeys(`${path}.`, entry);
        for (const field of Object.keys(entry)) {
          validateScalar(`${path}.${field}`, entry[field]);
        }
      } else {
        validateScalar(path, item);
      }
    });
  }
};
