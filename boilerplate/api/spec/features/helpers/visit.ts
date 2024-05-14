export default async function visit(path: string) {
  await page.goto(`http://localhost:3000/${path.replace(/^\//, '')}`)
}
