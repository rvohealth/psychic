import { PsychicController, BeforeAction } from '@rvohealth/psychic'

export default class AdminAuthedController extends PsychicController {
  // protected currentAdminUser: User
  @BeforeAction()
  public async authenticate() {
    throw `TODO: Implement admin authentication scheme!`
    // implement an authentication pattern that ends with you setting
    // this.currentAdminUser to an admin user. i.e.
    //
    // const adminToken = this.req.headers['token']
    // const adminUserId = Encrypt.decrypt(token)
    // this.currentAdminUser = await AdminUser.find(adminUserId)
    //
    //
    // const adminUserId = this.getCookie('adminToken')
    // const adminUser = await AdminUser.find(adminUserId)
    // if (!adminUser) return this.unauthorized()

    // this.currentAdminUser = adminUser
  }
}
