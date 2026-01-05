import { readEnv } from '../../src/utils/env';

describe('env utils', () => {
  it('reads from process.env when present and trims', () => {
    const original = (globalThis as any).process;
    try {
      (globalThis as any).process = { env: { FOO: '  bar  ' } } as any;
      expect(readEnv('FOO')).toBe('bar');
    } finally {
      (globalThis as any).process = original;
    }
  });

  it('returns undefined when not present', () => {
    const original = (globalThis as any).process;
    try {
      (globalThis as any).process = { env: {} } as any;
      expect(readEnv('NOPE')).toBeUndefined();
    } finally {
      (globalThis as any).process = original;
    }
  });

  it('supports Deno when process is not present', () => {
    const originalProcess = (globalThis as any).process;
    const originalDeno = (globalThis as any).Deno;
    try {
      delete (globalThis as any).process;
      (globalThis as any).Deno = {
        env: { get: (k: string) => (k === 'FOO' ? '  baz  ' : undefined) },
      } as any;
      expect(readEnv('FOO')).toBe('baz');
    } finally {
      (globalThis as any).process = originalProcess;
      (globalThis as any).Deno = originalDeno;
    }
  });

  it('returns undefined when neither process nor Deno exist', () => {
    const originalProcess = (globalThis as any).process;
    const originalDeno = (globalThis as any).Deno;
    try {
      delete (globalThis as any).process;
      delete (globalThis as any).Deno;
      expect(readEnv('ANY')).toBeUndefined();
    } finally {
      (globalThis as any).process = originalProcess;
      (globalThis as any).Deno = originalDeno;
    }
  });
});
