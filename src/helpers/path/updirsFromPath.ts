export default function updirsFromPath(path: string) {
  return path.length === 0
    ? ''
    : path
        .split('/')
        .map(() => '../')
        .join('')
}
