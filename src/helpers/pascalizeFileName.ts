import { capitalize, pascalize } from '@rvohealth/dream'

export default function pascalizeFileName(route: string): string {
  return route
    .split('/')
    .map(segment => capitalize(pascalize(segment)))
    .join('')
}
