export default function updirs(numUpdirs: number) {
  if (numUpdirs === 0) return './'

  let updirs = ''
  for (let i = 0; i < numUpdirs; i++) {
    updirs += '../'
  }
  return updirs
}
