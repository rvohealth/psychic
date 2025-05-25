import { ViewModelSerializer } from '@rvoh/dream'
import MyViewModel from '../../view-models/MyViewModel.js'

// Summary serializer: only name
export const MyViewModelSummarySerializer = (data: MyViewModel) =>
  ViewModelSerializer(MyViewModel, data).attribute('name', { openapi: ['string', 'null'] })

// Full serializer: name, favoriteNumber
export default (data: MyViewModel) =>
  MyViewModelSummarySerializer(data).attribute('favoriteNumber', { openapi: ['number', 'null'] })
