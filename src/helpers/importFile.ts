export default async function importFile(filepath: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await import(filepath)
}
