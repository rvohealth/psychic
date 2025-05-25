import { DreamSerializer } from '@rvoh/dream'
import Pet from '../../models/Pet.js'

export const AdminPetSummarySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('id')

export default (data: Pet) => AdminPetSummarySerializer(data).attribute('name')
