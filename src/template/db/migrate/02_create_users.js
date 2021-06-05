export async function up(m) {
  await m.createTable('users', t => {
    t.string('email')
    t.string('password')
    t.string('password_digest')
  })
}

export function down() {
}
