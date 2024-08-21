import { pascalize } from '@rvohealth/dream'
import {
  sharedPathPrefix,
  standardizeFullyQualifiedModelName,
} from '@rvohealth/dream/psychic-support-helpers'
import psychicPath, { PsychicPaths } from './psychicPath'

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
      return `${destinationPath}${fullyQualifiedDestinationModelName}Factory`

    case 'serializers':
      return `${destinationPath}${fullyQualifiedDestinationModelName}Serializer`

    default:
      return `${destinationPath}${fullyQualifiedDestinationModelName}`
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

  const updirs =
    originPathToRemove.length === 0
      ? ''
      : originPathToRemove
          .split('/')
          .map(() => '../')
          .join('')

  return updirs + destinationPath.slice(sharedPrefixLength)
}
