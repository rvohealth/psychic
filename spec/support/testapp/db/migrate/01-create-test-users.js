export async function change(m) {
  await m.createTable('test_users', t => {
    t.string('email')
    t.string('password')
  })
}
