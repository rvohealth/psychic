export default class NoQueueForSpecifiedQueueName extends Error {
  constructor(private workstream: string) {
    super()
  }

  public get message() {
    return `Error enqueueing background job
No queue matches "${this.workstream}"
`
  }
}
