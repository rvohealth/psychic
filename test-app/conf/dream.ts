import { Dreamconf } from '@rvohealth/dream'

export default function configureDream(dreamconf: Dreamconf) {
  dreamconf.set('primaryKeyType', 'bigserial')

  dreamconf.set('dbCredentials', {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST!,
      name: process.env.DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
  })
}
