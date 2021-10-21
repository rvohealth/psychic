import ghosts from 'src/ghost/ghosts'

class Ghost {
  static spawn(...args) {
    return ghosts.addStaticMethod(...args)
  }
}

export default Ghost
