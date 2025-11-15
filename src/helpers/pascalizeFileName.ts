import { capitalize, pascalize } from '@rvoh/dream/utils'

export default function pascalizeFileName(route: string): string {
  return route
    .split('/')
    .map(segment => capitalize(pascalize(segment)))
    .join('')
}
