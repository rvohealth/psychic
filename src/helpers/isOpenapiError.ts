export interface OpenApiError {
  message: string
  name: string
  status: number
  path: string
  errors: string[]
}

export default function isOpenapiError(error: OpenApiError) {
  return error?.name && error?.status && error?.path && error?.errors?.length
}
