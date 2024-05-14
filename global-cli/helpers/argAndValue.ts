export default function argAndValue(arg: string, args: string[]): [string | null, string | null] {
  const argIndex = args.findIndex(a => a === arg)

  const foundArg = argIndex === -1 ? null : args[argIndex]
  const foundValue = argIndex === -1 ? null : valueOrNull(argIndex, args)

  return [foundArg, foundValue]
}

function valueOrNull(argIndex: number, args: string[]) {
  let value: string | null = args[argIndex + 1]
  if (/--/.test(value)) value = null
  return value
}
