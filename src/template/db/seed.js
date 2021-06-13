import BlackCat from 'app/dreams/black-cat'
import User from 'app/dreams/user'

export default async () => {
  const user = await User.create({ email: 'jim', password: 'fishman' })
  await BlackCat.create({ user_id: user.id, cool: 'shimbucktwo' })
}
