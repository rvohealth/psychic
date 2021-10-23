export async function up(m) {
  await m.createTable('test_users', t => {
    t.string('email')
    t.string('password')
  })
}

export function down() {
}

