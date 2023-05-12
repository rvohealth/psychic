export default async function importFileWithNamedExport(filePath: string, namedExport: string = 'default') {
  const file = await import(filePath)
  if (file?.default?.[namedExport]) return file.default[namedExport]
  return file[namedExport]
}
