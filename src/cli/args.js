class CommandArgs {
  get program() {
    return process.argv[2].split(':')[0]
  }

  get command() {
    const split = process.argv[2].split(':')
    if (split.length < 2) return null
    return split[1]
  }

  get args() {
    return process.argv.slice(3)
  }
}

export default CommandArgs
