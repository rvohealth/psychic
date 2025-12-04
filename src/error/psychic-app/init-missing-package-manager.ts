export default class PsychicAppInitMissingPackageManager extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must set packageManager when initializing a new PsychicApp.

within conf/app.ts, you must have a call to "#set('packageManager', '<YOUR_CHOSEN_PACKAGE_MANAGER>')", i.e.

  // conf/app.ts
  export default async (psy: PsychicApp) => {
    psy.set('packageManager', 'pnpm')
  }
    `
  }
}
