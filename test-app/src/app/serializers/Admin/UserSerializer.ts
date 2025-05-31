import { DreamSerializer } from '@rvoh/dream'
import User from '../../models/User.js'
import { AdminPetSummarySerializer } from './PetSerializer.js'

export const AdminUserSummarySerializer = (data: User) => DreamSerializer(User, data).attribute('id')

export default (data: User) =>
  AdminUserSummarySerializer(data)
    .attribute('name')
    .rendersMany('pets', { serializer: AdminPetSummarySerializer })
