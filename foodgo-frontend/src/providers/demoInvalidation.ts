/** Quotes are persisted for confirmation, but do not change cart/catalog resources. */
export function demoInvalidatesResources(path: string, method: string) {
  return method !== 'GET' && !(method === 'POST' && path === '/checkout/quotes');
}
