import path from 'path'

export default class Event {
  constructor({
    bree,
  }) {
    this._bree = bree
    this._jobCounter = 0
  }

  get _jobsPath() {
    if (process.env.CORE_TEST) return path.join(__dirname.replace(/\/src\//, '/dist/'), 'core', 'jobs')
    return path.join(__dirname.replace(/\/src\//, '/dist/'), 'jobs')
  }

  _jobPath(jobName) {
    return path.join(this._jobsPath, `${jobName}.js`)
  }

  _generateName(cb, identifier) {
    this._jobCounter += 1
    return md5(cb.toString() + '::' + identifier + '::' + this._jobCounter)
  }
}
