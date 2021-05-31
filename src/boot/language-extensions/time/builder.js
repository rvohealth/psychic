import moment from 'moment'

export default class TimeBuilder {
  get number() {
    return this._number
  }

  get metric() {
    return this._metric
  }

  constructor() {
    this._number =  null
    this._metric = null
  }

  seconds(number) {
    this._number = number
    this._metric = 'seconds'
    return this
  }

  minutes(number) {
    this._number = number
    this._metric = 'minutes'
    return this
  }

  hours(number) {
    this._number = number
    this._metric = 'hours'
    return this
  }

  days(number) {
    this._number = number
    this._metric = 'days'
    return this
  }

  months(number) {
    this._number = number
    this._metric = 'months'
    return this
  }

  years(number) {
    this._number = number
    this._metric = 'years'
    return this
  }

  ago() {
    return moment()
      .subtract(this.number, this.metric)
  }

  fromNow() {
    return moment()
      .add(this.number, this.metric)
  }
}
