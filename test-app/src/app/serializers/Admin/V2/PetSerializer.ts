import { DreamSerializer } from '@rvoh/dream'
import Pet from '../../../models/Pet.js'

export const AdminV2PetSummarySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('id')

export default (data: Pet) => AdminV2PetSummarySerializer(data).attribute('name')
