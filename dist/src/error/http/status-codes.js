"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HttpStatusCodeMap;
(function (HttpStatusCodeMap) {
    HttpStatusCodeMap[HttpStatusCodeMap["continue"] = 100] = "continue";
    /**
     * the requester has asked the server to switch protocols and the server has agreed to do so.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["switching_protocols"] = 101] = "switching_protocols";
    /**
     * a webdav request may contain many sub-requests involving file operations, requiring a long time to complete the request.
     * this code indicates that the server has received and is processing the request, but no response is available yet.
     * this prevents the client from timing out and assuming the request was lost.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["processing"] = 102] = "processing";
    /**
     * standard response for successful http requests.
     * the actual response will depend on the request method used.
     * in a get request, the response will contain an entity corresponding to the requested resource.
     * in a post request, the response will contain an entity describing or containing the result of the action.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["ok"] = 200] = "ok";
    /**
     * the request has been fulfilled, resulting in the creation of a new resource.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["created"] = 201] = "created";
    /**
     * the request has been accepted for processing, but the processing has not been completed.
     * the request might or might not be eventually acted upon, and may be disallowed when processing occurs.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["accepted"] = 202] = "accepted";
    /**
     * since http/1.1
     * the server is a transforming proxy that received a 200 ok from its origin,
     * but is returning a modified version of the origin's response.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["non_authoritative_information"] = 203] = "non_authoritative_information";
    /**
     * the server successfully processed the request and is not returning any content.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["no_content"] = 204] = "no_content";
    /**
     * the server successfully processed the request, but is not returning any content.
     * unlike a 204 response, this response requires that the requester reset the document view.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["reset_content"] = 205] = "reset_content";
    /**
     * the server is delivering only part of the resource (byte serving) due to a range header sent by the client.
     * the range header is used by http clients to enable resuming of interrupted downloads,
     * or split a download into multiple simultaneous streams.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["partial_content"] = 206] = "partial_content";
    /**
     * the message body that follows is an xml message and can contain a number of separate response codes,
     * depending on how many sub-requests were made.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["multi_status"] = 207] = "multi_status";
    /**
     * the members of a dav binding have already been enumerated in a preceding part of the (multistatus) response,
     * and are not being included again.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["already_reported"] = 208] = "already_reported";
    /**
     * the server has fulfilled a request for the resource,
     * and the response is a representation of the result of one or more instance-manipulations applied to the current instance.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["im_used"] = 226] = "im_used";
    /**
     * indicates multiple options for the resource from which the client may choose (via agent-driven content negotiation).
     * for example, this code could be used to present multiple video format options,
     * to list files with different filename extensions, or to suggest word-sense disambiguation.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["multiple_choices"] = 300] = "multiple_choices";
    /**
     * this and all future requests should be directed to the given uri.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["moved_permanently"] = 301] = "moved_permanently";
    /**
     * this is an example of industry practice contradicting the standard.
     * the http/1.0 specification (rfc 1945) required the client to perform a temporary redirect
     * (the original describing phrase was "moved temporarily"), but popular browsers implemented 302
     * with the functionality of a 303 see other. therefore, http/1.1 added status codes 303 and 307
     * to distinguish between the two behaviours. however, some web applications and frameworks
     * use the 302 status code as if it were the 303.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["found"] = 302] = "found";
    /**
     * since http/1.1
     * the response to the request can be found under another uri using a get method.
     * when received in response to a post (or put/delete), the client should presume that
     * the server has received the data and should issue a redirect with a separate get message.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["see_other"] = 303] = "see_other";
    /**
     * indicates that the resource has not been modified since the version specified by the request headers if-modified-since or if-none-match.
     * in such case, there is no need to retransmit the resource since the client still has a previously-downloaded copy.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["not_modified"] = 304] = "not_modified";
    /**
     * since http/1.1
     * the requested resource is available only through a proxy, the address for which is provided in the response.
     * many http clients (such as mozilla and internet explorer) do not correctly handle responses with this status code, primarily for security reasons.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["use_proxy"] = 305] = "use_proxy";
    /**
     * no longer used. originally meant "subsequent requests should use the specified proxy."
     */
    HttpStatusCodeMap[HttpStatusCodeMap["switch_proxy"] = 306] = "switch_proxy";
    /**
     * since http/1.1
     * in this case, the request should be repeated with another uri; however, future requests should still use the original uri.
     * in contrast to how 302 was historically implemented, the request method is not allowed to be changed when reissuing the original request.
     * for example, a post request should be repeated using another post request.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["temporary_redirect"] = 307] = "temporary_redirect";
    /**
     * the request and all future requests should be repeated using another uri.
     * 307 and 308 parallel the behaviors of 302 and 301, but do not allow the http method to change.
     * so, for example, submitting a form to a permanently redirected resource may continue smoothly.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["permanent_redirect"] = 308] = "permanent_redirect";
    /**
     * the server cannot or will not process the request due to an apparent client error
     * (e.g., malformed request syntax, too large size, invalid request message framing, or deceptive request routing).
     */
    HttpStatusCodeMap[HttpStatusCodeMap["bad_request"] = 400] = "bad_request";
    /**
     * similar to 403 forbidden, but specifically for use when authentication is required and has failed or has not yet
     * been provided. the response must include a www-authenticate header field containing a challenge applicable to the
     * requested resource. see basic access authentication and digest access authentication. 401 semantically means
     * "unauthenticated",i.e. the user does not have the necessary credentials.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["unauthorized"] = 401] = "unauthorized";
    /**
     * reserved for future use. the original intention was that this code might be used as part of some form of digital
     * cash or micro payment scheme, but that has not happened, and this code is not usually used.
     * google developers api uses this status if a particular developer has exceeded the daily limit on requests.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["payment_required"] = 402] = "payment_required";
    /**
     * the request was valid, but the server is refusing action.
     * the user might not have the necessary permissions for a resource.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["forbidden"] = 403] = "forbidden";
    /**
     * the requested resource could not be found but may be available in the future.
     * subsequent requests by the client are permissible.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["not_found"] = 404] = "not_found";
    /**
     * a request method is not supported for the requested resource;
     * for example, a get request on a form that requires data to be presented via post, or a put request on a read-only resource.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["method_not_allowed"] = 405] = "method_not_allowed";
    /**
     * the requested resource is capable of generating only content not acceptable according to the accept headers sent in the request.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["not_acceptable"] = 406] = "not_acceptable";
    /**
     * the client must first authenticate itself with the proxy.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["proxy_authentication_required"] = 407] = "proxy_authentication_required";
    /**
     * the server timed out waiting for the request.
     * according to http specifications:
     * "the client did not produce a request within the time that the server was prepared to wait. the client may repeat the request without modifications at any later time."
     */
    HttpStatusCodeMap[HttpStatusCodeMap["request_timeout"] = 408] = "request_timeout";
    /**
     * indicates that the request could not be processed because of conflict in the request,
     * such as an edit conflict between multiple simultaneous updates.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["conflict"] = 409] = "conflict";
    /**
     * indicates that the resource requested is no longer available and will not be available again.
     * this should be used when a resource has been intentionally removed and the resource should be purged.
     * upon receiving a 410 status code, the client should not request the resource in the future.
     * clients such as search engines should remove the resource from their indices.
     * most use cases do not require clients and search engines to purge the resource, and a "404 not found" may be used instead.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["gone"] = 410] = "gone";
    /**
     * the request did not specify the length of its content, which is required by the requested resource.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["length_required"] = 411] = "length_required";
    /**
     * the server does not meet one of the preconditions that the requester put on the request.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["precondition_failed"] = 412] = "precondition_failed";
    /**
     * the request is larger than the server is willing or able to process. previously called "request entity too large".
     */
    HttpStatusCodeMap[HttpStatusCodeMap["payload_too_large"] = 413] = "payload_too_large";
    /**
     * the uri provided was too long for the server to process. often the result of too much data being encoded as a query-string of a get request,
     * in which case it should be converted to a post request.
     * called "request-uri too long" previously.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["uri_too_long"] = 414] = "uri_too_long";
    /**
     * the request entity has a media type which the server or resource does not support.
     * for example, the client uploads an image as image/svg+xml, but the server requires that images use a different format.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["unsupported_media_type"] = 415] = "unsupported_media_type";
    /**
     * the client has asked for a portion of the file (byte serving), but the server cannot supply that portion.
     * for example, if the client asked for a part of the file that lies beyond the end of the file.
     * called "requested range not satisfiable" previously.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["range_not_satisfiable"] = 416] = "range_not_satisfiable";
    /**
     * the server cannot meet the requirements of the expect request-header field.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["expectation_failed"] = 417] = "expectation_failed";
    /**
     * this code was defined in 1998 as one of the traditional ietf april fools' jokes, in rfc 2324, hyper text coffee pot control protocol,
     * and is not expected to be implemented by actual http servers. the rfc specifies this code should be returned by
     * teapots requested to brew coffee. this http status is used as an easter egg in some websites, including google.com.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["i_am_a_teapot"] = 418] = "i_am_a_teapot";
    /**
     * the request was directed at a server that is not able to produce a response (for example because a connection reuse).
     */
    HttpStatusCodeMap[HttpStatusCodeMap["misdirected_request"] = 421] = "misdirected_request";
    /**
     * the request was well-formed but was unable to be followed due to semantic errors.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["unprocessable_entity"] = 422] = "unprocessable_entity";
    /**
     * the resource that is being accessed is locked.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["locked"] = 423] = "locked";
    /**
     * the request failed due to failure of a previous request (e.g., a proppatch).
     */
    HttpStatusCodeMap[HttpStatusCodeMap["failed_dependency"] = 424] = "failed_dependency";
    /**
     * the client should switch to a different protocol such as tls/1.0, given in the upgrade header field.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["upgrade_required"] = 426] = "upgrade_required";
    /**
     * the origin server requires the request to be conditional.
     * intended to prevent "the 'lost update' problem, where a client
     * gets a resource's state, modifies it, and puts it back to the server,
     * when meanwhile a third party has modified the state on the server, leading to a conflict."
     */
    HttpStatusCodeMap[HttpStatusCodeMap["precondition_required"] = 428] = "precondition_required";
    /**
     * the user has sent too many requests in a given amount of time. intended for use with rate-limiting schemes.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["too_many_requests"] = 429] = "too_many_requests";
    /**
     * the server is unwilling to process the request because either an individual header field,
     * or all the header fields collectively, are too large.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["request_header_fields_too_large"] = 431] = "request_header_fields_too_large";
    /**
     * a server operator has received a legal demand to deny access to a resource or to a set of resources
     * that includes the requested resource. the code 451 was chosen as a reference to the novel fahrenheit 451.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["unavailable_for_legal_reasons"] = 451] = "unavailable_for_legal_reasons";
    /**
     * a generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["internal_server_error"] = 500] = "internal_server_error";
    /**
     * the server either does not recognize the request method, or it lacks the ability to fulfill the request.
     * usually this implies future availability (e.g., a new feature of a web-service api).
     */
    HttpStatusCodeMap[HttpStatusCodeMap["not_implemented"] = 501] = "not_implemented";
    /**
     * the server was acting as a gateway or proxy and received an invalid response from the upstream server.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["bad_gateway"] = 502] = "bad_gateway";
    /**
     * the server is currently unavailable (because it is overloaded or down for maintenance).
     * generally, this is a temporary state.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["service_unavailable"] = 503] = "service_unavailable";
    /**
     * the server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["gateway_timeout"] = 504] = "gateway_timeout";
    /**
     * the server does not support the http protocol version used in the request
     */
    HttpStatusCodeMap[HttpStatusCodeMap["http_version_not_supported"] = 505] = "http_version_not_supported";
    /**
     * transparent content negotiation for the request results in a circular reference.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["variant_also_negotiates"] = 506] = "variant_also_negotiates";
    /**
     * the server is unable to store the representation needed to complete the request.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["insufficient_storage"] = 507] = "insufficient_storage";
    /**
     * the server detected an infinite loop while processing the request.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["loop_detected"] = 508] = "loop_detected";
    /**
     * further extensions to the request are required for the server to fulfill it.
     */
    HttpStatusCodeMap[HttpStatusCodeMap["not_extended"] = 510] = "not_extended";
    /**
     * the client needs to authenticate to gain network access.
     * intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used
     * to require agreement to terms of service before granting full internet access via a wi-fi hotspot).
     */
    HttpStatusCodeMap[HttpStatusCodeMap["network_authentication_required"] = 511] = "network_authentication_required";
})(HttpStatusCodeMap || (HttpStatusCodeMap = {}));
exports.default = HttpStatusCodeMap;
