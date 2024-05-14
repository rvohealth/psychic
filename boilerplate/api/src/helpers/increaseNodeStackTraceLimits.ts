export default function increaseNodeStackTraceLimits() {
  Error.stackTraceLimit = 50
}
