import { DreamSerializer } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'
import Pet from '../models/Pet.js'

// subset override on a scalar pg enum column (species_types_enum): the spec
// renders only 'cat', so an enum sync must export only 'cat' from this site
export const PetSpeciesSubsetSerializer = (pet: Pet) =>
  DreamSerializer(Pet, pet).attribute('species', {
    openapi: {
      type: ['string', 'null'],
      enum: ['cat'],
    },
  })

// plain response rendering of a nullable pg enum column (balloon_colors_enum),
// used by the suppressed (mobile) spec to prove suppressResponseEnums does not
// suppress enum-sync collection
export const BalloonColorResponseSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('color')

// items-level subset override on an array pg enum column (pet_treats_enum[]):
// the override's enum lives at items.enum, not at the top level
export const PetTreatsItemsSubsetSerializer = (pet: Pet) =>
  DreamSerializer(Pet, pet).attribute('favoriteTreats', {
    openapi: {
      type: ['array', 'null'],
      items: {
        type: 'string',
        enum: ['snick snowcks'],
      },
    },
  })

// hand-written enum with no pg type name behind it: enum syncs have no pg name
// to export it under, so its values must never appear in a synced enums file
export const HandWrittenEnumSerializer = (pet: Pet) =>
  DreamSerializer(Pet, pet).customAttribute('mood', () => 'zonked_out_on_catnip', {
    openapi: {
      type: 'string',
      enum: ['zonked_out_on_catnip', 'chilling_on_the_windowsill'],
    },
  })

// two different subset overrides of balloon_colors_enum, exposed at two sites
// in the same spec: the export must be the union of both subsets
export const BalloonColorBlueSubsetSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('color', {
    openapi: {
      type: ['string', 'null'],
      enum: ['blue'],
    },
  })

export const BalloonColorGreenSubsetSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('color', {
    openapi: {
      type: ['string', 'null'],
      enum: ['green'],
    },
  })
