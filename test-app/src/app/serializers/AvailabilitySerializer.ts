import { DreamSerializer } from '@rvoh/dream'
import Availability from '../models/Availability.js'

export const AvailabilitySummarySerializer = (availability: Availability) =>
  DreamSerializer(Availability, availability).attribute('id')

export const AvailabilitySerializer = (availability: Availability) =>
  AvailabilitySummarySerializer(availability)
    .attribute('start')
    .attribute('starttz')
    .attribute('end')
    .attribute('endtz')
    .attribute('times')
    .attribute('timetzs')
