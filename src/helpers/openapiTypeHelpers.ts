import { StringToInt } from './typeHelpers.js'

export type OpenapiResponseBody<
  Paths,
  Uri extends keyof Paths & string,
  HttpMethod extends keyof Paths[Uri] | undefined = undefined,
  ResponseCode extends HttpMethod extends undefined
    ? never
    : Paths[Uri][HttpMethod & keyof Paths[Uri]] extends never
      ? never
      : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
            keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]] extends never
        ? never
        : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
              keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]] extends number
          ? `${keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
              keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]]}`
          : never = HttpMethod extends undefined
    ? never
    : Paths[Uri][HttpMethod & keyof Paths[Uri]] extends never
      ? never
      : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
            keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]] extends never
        ? never
        : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
              keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]] extends number
          ? `${keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
              keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]]}`
          : never,
  Responses = HttpMethod extends keyof Paths[Uri]
    ? Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' & keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]]
    : undefined,
  Content = Responses extends undefined
    ? undefined
    : ResponseCode extends undefined
      ? undefined
      : ResponseCode extends string
        ? Responses[StringToInt<ResponseCode> & keyof Responses]['content' &
            keyof Responses[StringToInt<ResponseCode> & keyof Responses]]
        : undefined,
  JsonContent = Content extends undefined ? undefined : Content['application/json' & keyof Content],
> = JsonContent

export type OpenapiRequestBody<
  Paths,
  Uri extends keyof Paths & string,
  HttpMethod extends keyof Paths[Uri] | undefined = undefined,
  RequestBody = HttpMethod extends keyof Paths[Uri]
    ? Paths[Uri][HttpMethod & keyof Paths[Uri]]['requestBody' &
        keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]]
    : undefined,
  Content = RequestBody extends undefined ? undefined : RequestBody['content' & keyof RequestBody],
  JsonContent = Content extends undefined ? undefined : Content['application/json' & keyof Content],
> = JsonContent
