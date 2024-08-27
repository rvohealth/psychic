# global-cli

The global-cli section of psychic behaves differently than the rest of psychic. For starters, it is really only useful for provisioning a new psychic app. Anything else can be done with the local `yarn psy` or `yarn dream` commands. Additionally, in order for the global psy command to be available, it unfortunately must be pointing to a raw javascript file in the package.json, which means we have to rebuild the global-cli source code every time we make a change (using `yarn build:global-cli`). This means that there will also, unfortunately, always be a `.global-cli-dist` folder committed to our repo, and it will pollute our file searching unnecessarily.

Additionally, in order for this cli command to work, the `boilerplate` folder is also used to seed files to the new app being generated. Many of the files within the boilerplate folder will be invalid javascript, and must be kept from any building that happens.

Testing the global cli is possible using the `yarn gpsycore` command (i.e. `yarn gpsycore new howyadoin --ws --redis`)
