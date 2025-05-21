export type OpenapiResponseBody<
  Paths,
  Uri extends keyof Paths & string,
  HttpMethod extends keyof Paths[Uri] | undefined = undefined,
  // ResponseCode extends HttpMethod extends undefined
  //   ? undefined
  //   : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
  //       keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]] = HttpMethod extends undefined
  //   ? undefined
  //   : keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
  //       keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]],
  Responses = HttpMethod extends undefined
    ? undefined
    : Paths[Uri][HttpMethod & keyof Paths[Uri]]['responses' &
        keyof Paths[Uri][HttpMethod & keyof Paths[Uri]]],
  // Content = Responses extends undefined
  //   ? undefined
  //   : ResponseCode extends undefined
  //     ? undefined
  //     : Responses[ResponseCode & keyof Responses]['content' &
  //         keyof Responses[ResponseCode & keyof Responses]],
  // JsonContent = Content['application/json' & keyof Content],
> = Responses extends undefined ? 'NO' : 'YES'
