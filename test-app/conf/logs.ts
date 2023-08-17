const SENSITIVE_FIELDS = [
  'pass*',
  'token*',
  'auth*',
  'secret*',
  'password',
  'token',
  'authentication',
  'authorization',
  'secret',
]

const defaultRequestFilter = {
  maskBody: SENSITIVE_FIELDS,
  maskQuery: SENSITIVE_FIELDS,
  maskHeaders: SENSITIVE_FIELDS,
  maxBodyLength: 500,
}

export default async () => {
  return {
    request: defaultRequestFilter,
    response: {
      ...defaultRequestFilter,
      excludeHeaders: ['*'], // Exclude all headers from responses,
      excludeBody: ['*'], // Exclude all body from responses
    },
  }
}
