export default async function importFileWithDefault(filePath: string) {
  const file = await import(filePath)
  if (file?.default?.default) return file.default.default
  if (file?.default) return file.default
  return file
}
