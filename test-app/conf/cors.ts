import getClientConfig from './client'

export default async () => {
  const clientConfig = await getClientConfig()

  return {
    credentials: true,
    origin: [clientConfig.host],
  }
}
