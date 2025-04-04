export default class PsychicApplicationInitMissingPackageManager extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must set packageManager when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#set('packageManager', '<YOUR_CHOSEN_PACKAGE_MANAGER>')", i.e.

  // conf/app.ts
  export default async (psy: PsychicApplication) => {
    psy.set('packageManager', 'yarn')
  }
    `
  }
}
