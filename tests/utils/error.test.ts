import { castToError } from '../../src/utils/error';

describe('Error Utils', () => {
  it('castToError returns Error for strings and objects', () => {
    expect(castToError(new Error('e'))).toBeInstanceOf(Error);
    expect(castToError('msg')).toBeInstanceOf(Error);
    expect(castToError({ a: 1 })).toBeInstanceOf(Error);
    // object with Error shape
    const objErr: any = { message: 'm', stack: 's', name: 'N' };
    const e = castToError(objErr);
    expect(e.message).toContain('m');
  });

  it('converts objects with Error toStringTag into Error copying message/stack/name', () => {
    const errObj: any = { message: 'm2', stack: 's2', name: 'N2', [Symbol.toStringTag]: 'Error' };
    const e2 = castToError(errObj);
    expect(e2).toBeInstanceOf(Error);
    expect(e2.message).toBe('m2');
    expect(e2.stack).toBe('s2');
    expect(e2.name).toBe('N2');
  });
});
