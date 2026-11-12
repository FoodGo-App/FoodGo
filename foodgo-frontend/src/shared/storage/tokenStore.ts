export type TokenBackend = {
  get: () => Promise<string | null>;
  set: (value: string | null) => Promise<void>;
};

// Every operation uses the same queue, including compare-and-delete. A rejected
// operation must not poison later writes (e.g. a login after a failed logout).
export function createTokenStore(backend: TokenBackend) {
  let tail: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  }
  return {
    get: () => serial(() => backend.get()),
    set: (value: string | null) => serial(() => backend.set(value)),
    clearIf: (expected: string) => serial(async () => {
      if (await backend.get() === expected) await backend.set(null);
    }),
  };
}
export type TokenStore = ReturnType<typeof createTokenStore>;
