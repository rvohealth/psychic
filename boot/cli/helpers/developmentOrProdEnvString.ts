export default function developmentOrProdEnvString() {
  if (process.env.NODE_ENV === 'production') return 'production'
  return 'development'
}
