export default function developmentOrTestEnv() {
  return ['development', 'test'].includes(process.env.NODE_ENV || '')
}
