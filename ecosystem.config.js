module.exports = {
  apps: [
    {
      script: 'yarn run psy listen',
      watch: '.',
    },
    {
      script: 'yarn run psy gaze',
      watch: '.',
    }
  ],
}
