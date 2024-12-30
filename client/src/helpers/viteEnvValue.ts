export default function viteEnvValue(envVar: ViteEnvVar) {
  return (import.meta as unknown as { env: Record<ViteEnvVar, string> }).env[envVar]
}

export type ViteEnvVar = 'VITE_PSYCHIC_ENV'
