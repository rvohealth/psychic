import Ghost from 'src/ghost'

function ghost(...args) {
  return Ghost.spawn(...args)
}

export default ghost
