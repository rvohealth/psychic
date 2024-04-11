// see https://gist.github.com/grimen/2963484
export default function getCaller(pattern?: RegExp) {
  try {
    throw new Error()
  } catch (err) {
    return (err as Error)
      .stack!.replace('Error\n', '')
      .split('\n')
      .find(line => (pattern ? pattern.test(line) : true))
      ?.match(/^[^/]+([^:]+):/)?.[1]
  }
}
