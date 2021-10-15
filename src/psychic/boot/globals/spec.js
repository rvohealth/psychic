import Factory from 'src/helpers/factory'

global.create = async function(dreamName, attrs) {
  return await Factory.create(dreamName, attrs)
}
