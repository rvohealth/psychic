import { Attribute, DreamColumn, DreamSerializer } from '@rvohealth/dream'
import Comment from '../models/Comment'

export class CommentSummarySerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<Comment, 'id'>
}

export default class CommentSerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends CommentSummarySerializer<DataType, Passthrough> {
  @Attribute('string')
  public body: DreamColumn<Comment, 'body'>
}

