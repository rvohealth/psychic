import { Attribute, DreamColumn, DreamSerializer, RendersMany, RendersOne } from '@rvohealth/dream'
import Post from '../models/Post'
import CommentSerializer from './CommentSerializer'

export class PostSummarySerializer<DataType extends Post, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute('string')
  public id: DreamColumn<Post, 'id'>
}

export default class PostSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersMany(() => CommentSerializer<any, any>)
  public comments: Comment[]

  @Attribute('string')
  public body: DreamColumn<Post, 'body'>
}

export class PostWithRecentCommentSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersOne(() => CommentSerializer<any, any>)
  public recentComment: Comment | null

  @Attribute('string')
  public body: DreamColumn<Post, 'body'>
}

export class PostWithCommentsSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersMany(() => CommentSerializer<any, any>)
  public comments: Comment[]

  @Attribute('string')
  public body: DreamColumn<Post, 'body'>
}
