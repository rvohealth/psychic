import { DreamSerializer } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'
import Pet from '../models/Pet.js'

// subset override on the STI type column (balloon_types_enum), the one column
// Dream lets a serializer narrow the enum of: the spec renders only
// 'BalloonLatex', so an enum sync must export only 'BalloonLatex' from this site
export const BalloonTypeLatexSubsetSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('type', {
    openapi: {
      enum: ['BalloonLatex'],
    },
  })

// a second subset override of balloon_types_enum, for a spec that renders both
// overrides: the export must be the union of both subsets
export const BalloonTypeMylarSubsetSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('type', {
    openapi: {
      enum: ['BalloonMylar'],
    },
  })

// plain response rendering of the STI type column, which renders every
// balloon_types_enum value
export const BalloonTypeResponseSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('type')

// plain response rendering of a nullable pg enum column (balloon_colors_enum),
// used by the suppressed (mobile) spec to prove suppressResponseEnums does not
// suppress enum-sync collection
export const BalloonColorResponseSerializer = (balloon: Balloon) =>
  DreamSerializer(Balloon, balloon).attribute('color')

// plain response rendering of an array pg enum column (pet_treats_enum[])
export const PetTreatsResponseSerializer = (pet: Pet) => DreamSerializer(Pet, pet).attribute('favoriteTreats')

// hand-written enum with no pg type name behind it: enum syncs have no pg name
// to export it under, so its values must never appear in a synced enums file
export const HandWrittenEnumSerializer = (pet: Pet) =>
  DreamSerializer(Pet, pet).customAttribute('mood', () => 'zonked_out_on_catnip', {
    openapi: {
      type: 'string',
      enum: ['zonked_out_on_catnip', 'chilling_on_the_windowsill'],
    },
  })
