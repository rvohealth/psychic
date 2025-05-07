import { DreamColumn } from '@rvoh/dream'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof Balloon>()

export default class Balloon extends ApplicationModel {
  public override get table() {
    return 'balloons' as const
  }

  public id: DreamColumn<Balloon, 'id'>
  public color: DreamColumn<Balloon, 'color'>
  public createdAt: DreamColumn<Balloon, 'createdAt'>
  public updatedAt: DreamColumn<Balloon, 'updatedAt'>
}
