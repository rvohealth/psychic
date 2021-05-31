import TimeBuilder from 'src/boot/language-extensions/time/builder'

Array.prototype.uniq = function() {
  return [...new Set(this)]
}

Number.prototype.seconds = function() {
  return new TimeBuilder().seconds(this)
}

Number.prototype.minutes = function() {
  return new TimeBuilder().minutes(this)
}

Number.prototype.hours = function() {
  return new TimeBuilder().hours(this)
}

Number.prototype.days = function() {
  return new TimeBuilder().days(this)
}

Number.prototype.months = function() {
  return new TimeBuilder().months(this)
}

Number.prototype.years = function() {
  return new TimeBuilder().years(this)
}
