export default class NoQueueForSpecifiedWorkstream extends Error {
  constructor(private workstream: string) {
    super()
  }

  public get message() {
    return `Error enqueueing background job
No queue found for workstream "${this.workstream}"
`
  }
}
