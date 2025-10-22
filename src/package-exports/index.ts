import _pluralize from 'pluralize-esm'
export const pluralize = _pluralize

export { default as PsychicBin } from '../bin/index.js'
export { default as PsychicCLI } from '../cli/index.js'
export { BeforeAction, OpenAPI } from '../controller/decorators.js'
export {
  default as PsychicController,
  type PsychicOpenapiControllerConfig,
  type PsychicOpenapiNames,
} from '../controller/index.js'
export { default as PsychicDevtools } from '../devtools/PsychicDevtools.js'
export { default as envLoader } from '../env/Loader.js'
export { default as I18nProvider } from '../i18n/provider.js'

export { default as generateController } from '../generate/controller.js'
export { default as generateResource } from '../generate/resource.js'
export { default as cookieMaxAgeFromCookieOpts } from '../helpers/cookieMaxAgeFromCookieOpts.js'
export { default as pathifyNestedObject } from '../helpers/pathifyNestedObject.js'
export { default as sanitizeString } from '../helpers/sanitizeString.js'

export { default as colorize } from '../cli/helpers/colorize.js'
export { default as PsychicLogos } from '../cli/helpers/PsychicLogos.js'
export {
  MissingControllerActionPairingInRoutes,
  type OpenapiContent,
  type OpenapiEndpointRendererOpts,
  type OpenapiEndpointResponse,
  type OpenapiHeaderOption,
  type OpenapiHeaders,
  type OpenapiHeaderType,
  type OpenapiMethodBody,
  type OpenapiParameterResponse,
  type OpenapiPathParams,
  type OpenapiQueryOption,
  type OpenapiResponses,
  type OpenapiSchema,
  type OpenapiPathParamOption as OpenapiUriOption,
} from '../openapi-renderer/endpoint.js'
export { default as PsychicImporter } from '../psychic-app/helpers/PsychicImporter.js'
export {
  default as PsychicApp,
  type DefaultPsychicOpenapiOptions,
  type NamedPsychicOpenapiOptions,
  type PsychicAppInitOptions,
} from '../psychic-app/index.js'
export { type UUID } from '../psychic-app/types.js'
export { default as PsychicRouter } from '../router/index.js'
export { type HttpMethod } from '../router/types.js'
export { createPsychicHttpInstance as getPsychicHttpInstance } from '../server/helpers/startPsychicServer.js'
export { default as PsychicServer } from '../server/index.js'
export { default as Params } from '../server/params.js'
export { default as PsychicSession } from '../session/index.js'
