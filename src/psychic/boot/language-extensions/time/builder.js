import moment from 'moment'

export default class TimeBuilder {
  get number() {
    return this._number
  }

  get metric() {
    return this._metric
  }

  // i know this is abusing getters, but it makes for cleaner api :)
  get ago() {
    return moment()
      .subtract(this.number, this.metric)
  }

  get fromNow() {
    return moment()
      .add(this.number, this.metric)
  }
  // end: abusing getters

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
}
