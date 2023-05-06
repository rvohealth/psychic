export default function pascalize(str: string) {
  return `${str}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s/]/, 'g'), '')
    .replace(new RegExp(/[\s/]+(.)(\w+)/, 'g'), ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`)
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), s => s.toUpperCase())
}
