export function joinBase(base: string, path: string): string {
  const normalizedBase = base.replace(/\/*$/, "/");
  const relativePath = path.replace(/^\/+/, "");
  return normalizedBase + relativePath;
}

export const url = (path: string): string =>
  joinBase(import.meta.env.BASE_URL, path);
