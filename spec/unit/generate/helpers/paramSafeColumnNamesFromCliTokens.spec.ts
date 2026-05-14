import paramSafeColumnNamesFromCliTokens from '../../../../src/generate/helpers/paramSafeColumnNamesFromCliTokens.js'

describe('paramSafeColumnNamesFromCliTokens', () => {
  it('camelizes scalar attribute names', () => {
    expect(paramSafeColumnNamesFromCliTokens(['phone_number:string', 'email:string'])).toEqual([
      'phoneNumber',
      'email',
    ])
  })

  it('filters reserved column names', () => {
    expect(
      paramSafeColumnNamesFromCliTokens([
        'name:string',
        'id:integer',
        'created_at:datetime',
        'updated_at:datetime',
        'deleted_at:datetime',
        'type:string',
      ]),
    ).toEqual(['name'])
  })

  it('filters belongs_to relationships (legacy form)', () => {
    expect(paramSafeColumnNamesFromCliTokens(['name:string', 'User:belongs_to'])).toEqual(['name'])
  })

  it('filters belongs_to relationships with @alias rename', () => {
    // Important: the aliased FK property name (canceledBy) must NOT leak into
    // the paramSafe allowlist any more than the legacy form does. The filter
    // is by attributeType === 'belongs_to', so it catches both forms.
    expect(
      paramSafeColumnNamesFromCliTokens([
        'subject:string',
        'InternalUser@canceled_by:belongs_to:optional',
        'Messaging/Message@last_inbound_message:belongs_to:optional',
      ]),
    ).toEqual(['subject'])
  })

  it('filters polymorphic _type and _id suffix columns', () => {
    expect(paramSafeColumnNamesFromCliTokens(['name:string', 'owner_type:string', 'owner_id:uuid'])).toEqual([
      'name',
    ])
  })
})
