import snakeify from './snakeify'

export default function hyphenize(str: string) {
  return snakeify(str).replace(/_/g, '-')
}
