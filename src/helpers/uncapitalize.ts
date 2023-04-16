export default function uncapitalize(str: string) {
  return str.slice(0, 1).toLowerCase() + str.slice(1)
}
