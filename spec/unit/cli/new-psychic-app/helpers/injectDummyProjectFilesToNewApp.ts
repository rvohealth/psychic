export default async function injectDummyProjectFilesToNewApp() {
  // TODO: implement this once we decide to add spec coverage for extended
  // operations on a newly-generated psychic app (i.e. making sure we can
  // generate a new model without errors, making sure the dev server starts up, etc...).
  //
  // it should do this using the <rootDir>/spec-boilerplate folder, which
  // will need to be added, but is already ignored by tsconfig, prettier, etc...,
  // since the folder may contain files that won't build properly without being
  // dropped into a psychic app.
  //
  // it would be good if the spec-boilerplate folder were indexed with scenarios i.e.:
  //   spec-boilerplate/with-react,
  //   spec-boilerplate/with-vue,
  //   spec-boilerplate/with-authentication-pattern,
  //   etc...
  //
  // and then add a `scenario` argument to this function, which will select from these
  // scenarios and then copy all boilerplate over to the `howyadoin` folder
}
