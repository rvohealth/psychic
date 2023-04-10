export default async () => {
  return {
    host: process.env.API_HOST || 'http://localhost:7777',
  }
}
