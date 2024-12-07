export default class WorkstreamIncompatibleWithQueue extends Error {
  constructor(
    private className: string,
    private methodName: string,
    private workstream: string,
    private queue: string | undefined,
  ) {
    super()
  }

  public get message() {
    return `Error enqueueing background job
May specify a workstream or queue, but not both:
class: ${this.className}
method: ${this.methodName}
workstream: ${this.workstream}
queue: ${this.queue}
`
  }
}
