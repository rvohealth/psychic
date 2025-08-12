import { DreamSerializer } from '@rvoh/dream'
import SimpleSerializerModel from '../models/SimpleSerializerModel.js'

export const SimpleSerializerModelSummarySerializer = (simpleSerializerModel: SimpleSerializerModel) =>
  DreamSerializer(SimpleSerializerModel, simpleSerializerModel).attribute('id')

export const SimpleSerializerModelSerializer = (simpleSerializerModel: SimpleSerializerModel) =>
  SimpleSerializerModelSummarySerializer(simpleSerializerModel).attribute('name')
