export default async function importAll<ReturnType = unknown>(path: string) {
  return (await import(path)) as ReturnType
}
