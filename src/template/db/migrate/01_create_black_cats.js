export async function up(m) {
  await m.createTable('black_cats', t => {
    t.string('cool')
    t.int('user_id')
  })
}

export function down() {
}
