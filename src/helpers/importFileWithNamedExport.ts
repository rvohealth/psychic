export default async function importFileWithNamedExport<T>(
  filePath: string,
  namedExport: string = 'default',
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const file = await import(filePath)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  if (file?.default?.[namedExport]) return file.default[namedExport]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return file[namedExport] as T
}
