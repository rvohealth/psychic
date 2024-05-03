import { IdType } from '@rvohealth/dream'

export default function redisWsKey(userId: IdType, redisKeyPrefix: string) {
  return `${redisKeyPrefix}:${userId}:socket_ids`
}
