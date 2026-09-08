export function safeRedirect(value: string | string[] | undefined, fallback = '/') {
  const redirect = Array.isArray(value) ? value[0] : value;
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return fallback;
  return redirect;
}
