export default async function importFileWithDefault<T>(filePath: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const file = await import(filePath)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  if (file?.default?.default) return file.default.default
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  if (file?.default) return file.default
  return file as T
}
