import * as readline from 'node:readline'
const input = process.stdin
const output = process.stdout

export default async function cliPrompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input,
    output,
  })

  return new Promise(resolve => {
    if (process.env.BYPASS_CLI_PROMPT === '1') resolve('')
    else {
      rl.question(question, value => {
        rl.close()
        resolve(value)
      })
    }
  })
}
