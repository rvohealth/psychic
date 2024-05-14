export default function sleep(ms: number) {
  return new Promise(accept => {
    setTimeout(() => {
      accept({})
    }, ms)
  })
}
