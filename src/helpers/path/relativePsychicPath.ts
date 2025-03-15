import { pascalize, sharedPathPrefix, standardizeFullyQualifiedModelName } from '@rvoh/dream'
import psychicPath, { PsychicPaths } from './psychicPath.js'
import updirsFromPath from './updirsFromPath.js'

export default function (
  originDreamPathType: PsychicPaths,
  destinationDreamPathType: PsychicPaths,
  fullyQualifiedOriginModelName: string,
  fullyQualifiedDestinationModelName: string = fullyQualifiedOriginModelName,
) {
  fullyQualifiedOriginModelName = standardizeFullyQualifiedModelName(fullyQualifiedOriginModelName)
  fullyQualifiedDestinationModelName = pascalize(fullyQualifiedDestinationModelName)

  let pathToRemove = fullyQualifiedOriginModelName

  if (originDreamPathType === destinationDreamPathType) {
    const sharedPrefixLength = sharedPathPrefix(
      fullyQualifiedOriginModelName,
      fullyQualifiedDestinationModelName,
    ).length
    pathToRemove = fullyQualifiedOriginModelName.slice(sharedPrefixLength)
    fullyQualifiedDestinationModelName = fullyQualifiedDestinationModelName.slice(sharedPrefixLength)
  }

  const numAdditionalUpdirs = pathToRemove.split('/').length - 1
  let additionalUpdirs = ''

  for (let i = 0; i < numAdditionalUpdirs; i++) {
    additionalUpdirs = `../${additionalUpdirs}`
  }

  const baseRelativePath = psychicPathTypeRelativePath(originDreamPathType, destinationDreamPathType)
  let destinationPath = additionalUpdirs + (baseRelativePath.length ? baseRelativePath + '/' : '')

  if (destinationPath[0] !== '.') destinationPath = `./${destinationPath}`

  switch (destinationDreamPathType) {
    case 'db':
      return destinationPath

    case 'factories':
      return `${destinationPath}${fullyQualifiedDestinationModelName}Factory.js`

    case 'serializers':
      return `${destinationPath}${fullyQualifiedDestinationModelName}Serializer.js`

    default:
      return `${destinationPath}${fullyQualifiedDestinationModelName}.js`
  }
}

export function psychicPathTypeRelativePath(
  originDreamPathType: PsychicPaths,
  destinationDreamPathType: PsychicPaths,
) {
  const originPath = psychicPath(originDreamPathType)
  const destinationPath = psychicPath(destinationDreamPathType)
  const sharedPrefixLength = sharedPathPrefix(originPath, destinationPath).length
  const originPathToRemove = originPath.slice(sharedPrefixLength)

  return updirsFromPath(originPathToRemove) + destinationPath.slice(sharedPrefixLength)
}
