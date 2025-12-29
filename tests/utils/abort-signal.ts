export function createImmediateSignal(): AbortSignal {
  const ac = new AbortController();
  ac.abort();
  return ac.signal;
}

export function createTogglingSignal(): AbortSignal {
  let readCount = 0;
  const signal: any = {
    get aborted() {
      readCount++;
      return readCount >= 2; // false first read, true afterwards
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return signal as AbortSignal;
}

export function mockTimeout(temp: (ms: number) => AbortSignal | AbortSignal | undefined) {
  const orig = (AbortSignal as any).timeout;
  (AbortSignal as any).timeout = temp as any;
  return () => {
    if (orig === undefined) {
      delete (AbortSignal as any).timeout;
    } else {
      (AbortSignal as any).timeout = orig;
    }
  };
}

export function mockAny(temp: (signals: AbortSignal[]) => AbortSignal) {
  const orig = (AbortSignal as any).any;
  (AbortSignal as any).any = temp as any;
  return () => {
    if (orig === undefined) {
      delete (AbortSignal as any).any;
    } else {
      (AbortSignal as any).any = orig;
    }
  };
}
