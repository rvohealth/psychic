import ApiUsers from '../app/controllers/Api/Users'
import ApiV1Users from '../app/controllers/Api/V1/Users'
import Application from '../app/controllers/Application'
import BackgroundTest from '../app/controllers/BackgroundTest'
import Users from '../app/controllers/Users'

export default {
  'Api/Users': ApiUsers,
  'Api/V1/Users': ApiV1Users,
  'Application': Application,
  'BackgroundTest': BackgroundTest,
  'Users': Users,
}
