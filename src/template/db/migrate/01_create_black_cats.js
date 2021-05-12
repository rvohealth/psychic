import { migrate } from 'dist'

export async function up() {
  await migrate.createTable('black_cats', t => {
    t.string('cool')
  })
}

export function down() {
}
