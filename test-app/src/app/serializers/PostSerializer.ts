import { Attribute, DreamColumn, DreamSerializer, RendersMany, RendersOne } from '@rvoh/dream'
import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import CommentSerializer from './CommentSerializer.js'

export class PostSummarySerializer<DataType extends Post, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute(Post)
  public id: DreamColumn<Post, 'id'>
}

export default class PostSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersMany(() => CommentSerializer<any, any>)
  public comments: Comment[]

  @Attribute(Post)
  public body: DreamColumn<Post, 'body'>

  @Attribute(Post)
  public explicitlyOmittedFromParamSafeColumns: DreamColumn<Post, 'explicitlyOmittedFromParamSafeColumns'>
}

export class PostWithRecentCommentSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersOne(() => CommentSerializer<any, any>)
  public recentComment: Comment | null

  @Attribute(Post)
  public body: DreamColumn<Post, 'body'>
}

export class PostWithCommentsSerializer<
  DataType extends Post,
  Passthrough extends object,
> extends PostSummarySerializer<DataType, Passthrough> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersMany(() => CommentSerializer<any, any>)
  public comments: Comment[]

  @Attribute(Post)
  public body: DreamColumn<Post, 'body'>
}
