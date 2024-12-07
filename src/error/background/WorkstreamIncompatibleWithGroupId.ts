export default class WorkstreamIncompatibleWithGroupId extends Error {
  constructor(
    private className: string,
    private methodName: string,
    private workstream: string,
    private groupId: string | undefined,
  ) {
    super()
  }

  public get message() {
    return `Error enqueueing background job
groupId may be specified with queue, but not with workstream:
class: ${this.className}
method: ${this.methodName}
workstream: ${this.workstream}
groupId: ${this.groupId}
`
  }
}
