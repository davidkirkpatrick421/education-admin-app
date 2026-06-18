import { AsyncLocalStorage } from 'async_hooks';

// Carries the current request's session user so the API client interceptor can
// sign an internal JWT without every controller having to pass it through.
export const requestContext = new AsyncLocalStorage();
