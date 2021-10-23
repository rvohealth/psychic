export default function sleep(ms) {
  return new Promise(accept => {
    setTimeout(() => {
      accept()
    }, ms)
  })
}
