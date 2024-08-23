enum HttpStatusCodeMap {
  continue = 100,

  /**
   * the requester has asked the server to switch protocols and the server has agreed to do so.
   */
  switching_protocols = 101,

  /**
   * a webdav request may contain many sub-requests involving file operations, requiring a long time to complete the request.
   * this code indicates that the server has received and is processing the request, but no response is available yet.
   * this prevents the client from timing out and assuming the request was lost.
   */
  processing = 102,

  /**
   * standard response for successful http requests.
   * the actual response will depend on the request method used.
   * in a get request, the response will contain an entity corresponding to the requested resource.
   * in a post request, the response will contain an entity describing or containing the result of the action.
   */
  ok = 200,

  /**
   * the request has been fulfilled, resulting in the creation of a new resource.
   */
  created = 201,

  /**
   * the request has been accepted for processing, but the processing has not been completed.
   * the request might or might not be eventually acted upon, and may be disallowed when processing occurs.
   */
  accepted = 202,

  /**
   * since http/1.1
   * the server is a transforming proxy that received a 200 ok from its origin,
   * but is returning a modified version of the origin's response.
   */
  non_authoritative_information = 203,

  /**
   * the server successfully processed the request and is not returning any content.
   */
  no_content = 204,

  /**
   * the server successfully processed the request, but is not returning any content.
   * unlike a 204 response, this response requires that the requester reset the document view.
   */
  reset_content = 205,

  /**
   * the server is delivering only part of the resource (byte serving) due to a range header sent by the client.
   * the range header is used by http clients to enable resuming of interrupted downloads,
   * or split a download into multiple simultaneous streams.
   */
  partial_content = 206,

  /**
   * the message body that follows is an xml message and can contain a number of separate response codes,
   * depending on how many sub-requests were made.
   */
  multi_status = 207,

  /**
   * the members of a dav binding have already been enumerated in a preceding part of the (multistatus) response,
   * and are not being included again.
   */
  already_reported = 208,

  /**
   * the server has fulfilled a request for the resource,
   * and the response is a representation of the result of one or more instance-manipulations applied to the current instance.
   */
  im_used = 226,

  /**
   * indicates multiple options for the resource from which the client may choose (via agent-driven content negotiation).
   * for example, this code could be used to present multiple video format options,
   * to list files with different filename extensions, or to suggest word-sense disambiguation.
   */
  multiple_choices = 300,

  /**
   * this and all future requests should be directed to the given uri.
   */
  moved_permanently = 301,

  /**
   * this is an example of industry practice contradicting the standard.
   * the http/1.0 specification (rfc 1945) required the client to perform a temporary redirect
   * (the original describing phrase was "moved temporarily"), but popular browsers implemented 302
   * with the functionality of a 303 see other. therefore, http/1.1 added status codes 303 and 307
   * to distinguish between the two behaviours. however, some web applications and frameworks
   * use the 302 status code as if it were the 303.
   */
  found = 302,

  /**
   * since http/1.1
   * the response to the request can be found under another uri using a get method.
   * when received in response to a post (or put/delete), the client should presume that
   * the server has received the data and should issue a redirect with a separate get message.
   */
  see_other = 303,

  /**
   * indicates that the resource has not been modified since the version specified by the request headers if-modified-since or if-none-match.
   * in such case, there is no need to retransmit the resource since the client still has a previously-downloaded copy.
   */
  not_modified = 304,

  /**
   * since http/1.1
   * the requested resource is available only through a proxy, the address for which is provided in the response.
   * many http clients (such as mozilla and internet explorer) do not correctly handle responses with this status code, primarily for security reasons.
   */
  use_proxy = 305,

  /**
   * no longer used. originally meant "subsequent requests should use the specified proxy."
   */
  switch_proxy = 306,

  /**
   * since http/1.1
   * in this case, the request should be repeated with another uri; however, future requests should still use the original uri.
   * in contrast to how 302 was historically implemented, the request method is not allowed to be changed when reissuing the original request.
   * for example, a post request should be repeated using another post request.
   */
  temporary_redirect = 307,

  /**
   * the request and all future requests should be repeated using another uri.
   * 307 and 308 parallel the behaviors of 302 and 301, but do not allow the http method to change.
   * so, for example, submitting a form to a permanently redirected resource may continue smoothly.
   */
  permanent_redirect = 308,

  /**
   * the server cannot or will not process the request due to an apparent client error
   * (e.g., malformed request syntax, too large size, invalid request message framing, or deceptive request routing).
   */
  bad_request = 400,

  /**
   * similar to 403 forbidden, but specifically for use when authentication is required and has failed or has not yet
   * been provided. the response must include a www-authenticate header field containing a challenge applicable to the
   * requested resource. see basic access authentication and digest access authentication. 401 semantically means
   * "unauthenticated",i.e. the user does not have the necessary credentials.
   */
  unauthorized = 401,

  /**
   * reserved for future use. the original intention was that this code might be used as part of some form of digital
   * cash or micro payment scheme, but that has not happened, and this code is not usually used.
   * google developers api uses this status if a particular developer has exceeded the daily limit on requests.
   */
  payment_required = 402,

  /**
   * the request was valid, but the server is refusing action.
   * the user might not have the necessary permissions for a resource.
   */
  forbidden = 403,

  /**
   * the requested resource could not be found but may be available in the future.
   * subsequent requests by the client are permissible.
   */
  not_found = 404,

  /**
   * a request method is not supported for the requested resource;
   * for example, a get request on a form that requires data to be presented via post, or a put request on a read-only resource.
   */
  method_not_allowed = 405,

  /**
   * the requested resource is capable of generating only content not acceptable according to the accept headers sent in the request.
   */
  not_acceptable = 406,

  /**
   * the client must first authenticate itself with the proxy.
   */
  proxy_authentication_required = 407,

  /**
   * the server timed out waiting for the request.
   * according to http specifications:
   * "the client did not produce a request within the time that the server was prepared to wait. the client may repeat the request without modifications at any later time."
   */
  request_timeout = 408,

  /**
   * indicates that the request could not be processed because of conflict in the request,
   * such as an edit conflict between multiple simultaneous updates.
   */
  conflict = 409,

  /**
   * indicates that the resource requested is no longer available and will not be available again.
   * this should be used when a resource has been intentionally removed and the resource should be purged.
   * upon receiving a 410 status code, the client should not request the resource in the future.
   * clients such as search engines should remove the resource from their indices.
   * most use cases do not require clients and search engines to purge the resource, and a "404 not found" may be used instead.
   */
  gone = 410,

  /**
   * the request did not specify the length of its content, which is required by the requested resource.
   */
  length_required = 411,

  /**
   * the server does not meet one of the preconditions that the requester put on the request.
   */
  precondition_failed = 412,

  /**
   * the request is larger than the server is willing or able to process. previously called "request entity too large".
   */
  payload_too_large = 413,

  /**
   * the uri provided was too long for the server to process. often the result of too much data being encoded as a query-string of a get request,
   * in which case it should be converted to a post request.
   * called "request-uri too long" previously.
   */
  uri_too_long = 414,

  /**
   * the request entity has a media type which the server or resource does not support.
   * for example, the client uploads an image as image/svg+xml, but the server requires that images use a different format.
   */
  unsupported_media_type = 415,

  /**
   * the client has asked for a portion of the file (byte serving), but the server cannot supply that portion.
   * for example, if the client asked for a part of the file that lies beyond the end of the file.
   * called "requested range not satisfiable" previously.
   */
  range_not_satisfiable = 416,

  /**
   * the server cannot meet the requirements of the expect request-header field.
   */
  expectation_failed = 417,

  /**
   * this code was defined in 1998 as one of the traditional ietf april fools' jokes, in rfc 2324, hyper text coffee pot control protocol,
   * and is not expected to be implemented by actual http servers. the rfc specifies this code should be returned by
   * teapots requested to brew coffee. this http status is used as an easter egg in some websites, including google.com.
   */
  i_am_a_teapot = 418,

  /**
   * the request was directed at a server that is not able to produce a response (for example because a connection reuse).
   */
  misdirected_request = 421,

  /**
   * the request was well-formed but was unable to be followed due to semantic errors.
   */
  unprocessable_entity = 422,

  /**
   * the resource that is being accessed is locked.
   */
  locked = 423,

  /**
   * the request failed due to failure of a previous request (e.g., a proppatch).
   */
  failed_dependency = 424,

  /**
   * the client should switch to a different protocol such as tls/1.0, given in the upgrade header field.
   */
  upgrade_required = 426,

  /**
   * the origin server requires the request to be conditional.
   * intended to prevent "the 'lost update' problem, where a client
   * gets a resource's state, modifies it, and puts it back to the server,
   * when meanwhile a third party has modified the state on the server, leading to a conflict."
   */
  precondition_required = 428,

  /**
   * the user has sent too many requests in a given amount of time. intended for use with rate-limiting schemes.
   */
  too_many_requests = 429,

  /**
   * the server is unwilling to process the request because either an individual header field,
   * or all the header fields collectively, are too large.
   */
  request_header_fields_too_large = 431,

  /**
   * a server operator has received a legal demand to deny access to a resource or to a set of resources
   * that includes the requested resource. the code 451 was chosen as a reference to the novel fahrenheit 451.
   */
  unavailable_for_legal_reasons = 451,

  /**
   * a generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
   */
  internal_server_error = 500,

  /**
   * the server either does not recognize the request method, or it lacks the ability to fulfill the request.
   * usually this implies future availability (e.g., a new feature of a web-service api).
   */
  not_implemented = 501,

  /**
   * the server was acting as a gateway or proxy and received an invalid response from the upstream server.
   */
  bad_gateway = 502,

  /**
   * the server is currently unavailable (because it is overloaded or down for maintenance).
   * generally, this is a temporary state.
   */
  service_unavailable = 503,

  /**
   * the server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
   */
  gateway_timeout = 504,

  /**
   * the server does not support the http protocol version used in the request
   */
  http_version_not_supported = 505,

  /**
   * transparent content negotiation for the request results in a circular reference.
   */
  variant_also_negotiates = 506,

  /**
   * the server is unable to store the representation needed to complete the request.
   */
  insufficient_storage = 507,

  /**
   * the server detected an infinite loop while processing the request.
   */
  loop_detected = 508,

  /**
   * further extensions to the request are required for the server to fulfill it.
   */
  not_extended = 510,

  /**
   * the client needs to authenticate to gain network access.
   * intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used
   * to require agreement to terms of service before granting full internet access via a wi-fi hotspot).
   */
  network_authentication_required = 511,
}

export default HttpStatusCodeMap

export type HttpStatusSymbol = keyof typeof HttpStatusCodeMap
export type HttpStatusCode = `${HttpStatusCodeMap}`
export type HttpStatusCodeNumber =
  | 100
  | 101
  | 102
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 306
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 426
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511
