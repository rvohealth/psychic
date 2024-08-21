"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PsychicApplicationInitMissingRoutesCallback extends Error {
    constructor() {
        super();
    }
    get message() {
        return `
must set routes when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#set('routes', routesCb)", i.e.


  // conf/app.ts
  import routes from './routes'

  export default async (app: PsychicApplication) => {
    await app.set('routes', routes)
  }
    `;
    }
}
exports.default = PsychicApplicationInitMissingRoutesCallback;
