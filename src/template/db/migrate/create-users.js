export async function up(m) {
  await m.createTable('users', t => {
    t.string('email')
    t.string('password')
    t.string('password_digest')
    t.timestamp('created_at')
    t.timestamp('updated_at')
  })
}

export function down() {
}
