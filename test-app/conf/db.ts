export default () => {
  const defaults = {
    dialect: process.env.DB_DRIVER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'howl_core_dev',
  }

  return {
    development: {
      ...defaults,
    },

    test: {
      ...defaults,
      database: process.env.DB_NAME || 'howl_core_test',
    },

    production: {
      ...defaults,
      database: process.env.DB_NAME,
    },
  }
}
