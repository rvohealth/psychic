export default async function sleep(ms: number) {
  return await new Promise(accept => {
    setTimeout(() => {
      accept(undefined)
    }, ms)
  })
}
