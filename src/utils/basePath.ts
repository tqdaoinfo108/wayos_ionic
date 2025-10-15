const rawBase = import.meta.env.BASE_URL ?? '/';
const trimmedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export const getBasePath = (): string => trimmedBase;

export const withBasePath = (path: string): string => {
  if (!path) {
    return trimmedBase;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}`;
};
