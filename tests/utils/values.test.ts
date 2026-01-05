import { isEmptyObj, hasOwn, isObj, safeJSON, validatePositiveInteger } from '../../src/utils/values';

describe('Values Utils', () => {
  describe('isEmptyObj', () => {
    it('returns true for null/undefined/empty object', () => {
      expect(isEmptyObj(null)).toBe(true);
      expect(isEmptyObj(undefined)).toBe(true);
      expect(isEmptyObj({})).toBe(true);
    });

    it('returns false for object with properties', () => {
      expect(isEmptyObj({ a: 1 })).toBe(false);
    });
  });

  describe('hasOwn', () => {
    it('returns true when object has its own property', () => {
      const obj = { a: 1 };
      expect(hasOwn(obj, 'a')).toBe(true);
    });

    it('returns false for inherited properties', () => {
      function C(this: any) {
        this.a = 1;
      }
      C.prototype.b = 2 as any;
      const o: any = new (C as any)();
      expect(hasOwn(o, 'b')).toBe(false);
    });
  });

  describe('isObj', () => {
    it('identifies plain objects and not arrays/null', () => {
      expect(isObj({})).toBe(true);
      expect(isObj([])).toBe(false);
      expect(isObj(null)).toBe(false);
      expect(isObj('str')).toBe(false);
    });
  });

  describe('safeJSON', () => {
    it('parses valid JSON and returns undefined for invalid', () => {
      expect(safeJSON('{"a":1}')).toEqual({ a: 1 });
      expect(safeJSON('not-json')).toBeUndefined();
    });
  });

  describe('validatePositiveInteger', () => {
    it('returns the number when valid', () => {
      expect(validatePositiveInteger('n', 5)).toBe(5);
    });

    it('throws when not integer', () => {
      expect(() => validatePositiveInteger('n', 1.2)).toThrow();
      expect(() => validatePositiveInteger('n', '1' as any)).toThrow();
    });

    it('throws when negative', () => {
      expect(() => validatePositiveInteger('n', -1)).toThrow();
    });
  });
});
