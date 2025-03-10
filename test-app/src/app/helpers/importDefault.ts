export default async function importDefault<ReturnType = unknown>(path: string) {
  return ((await import(path)) as { default: ReturnType }).default
}
