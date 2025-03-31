## How to contribute to Psychic

## Requirements

In order to get started working on psychic locally, you will first need to install the following:

- nodejs >= 23.9.0
- postgres >= 13.4
- redis >= 7.2.0 (if using workers or websockets)

## Installation

Once done, you can clone the repo locally:

```bash
git clone https://github.com/rvohealth/psychic
```

once in, you will need to add two env files to the project root:

```
DB_USER=WHO_AM_I
DB_NAME=psychic_core_dev
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="REPLACE_ME"
LEGACY_APP_ENCRYPTION_KEY="REPLACE_ME"
```

```
# .env.test
PORT=7777
DB_USER=WHO_AM_I
DB_NAME=psychic_core_test
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="REPLACE_ME"
LEGACY_APP_ENCRYPTION_KEY="REPLACE_ME"
```

In each of these files, you will want to replace `WHO_AM_I` with the result of running `whoami` in your local terminal. Generally speaking, the username for postgres will be the name of the current user, though this can be different depending on how postgres was installed.

> NOTE: Whenever running any CLI commands, Dream will notice that your encryption keys are invalid, and will print warnings in the console with suggested keys that could work in their place. You can copy those key values, and place them into the `APP_ENCRYPTION_KEY` and `LEGACY_APP_ENCRYPTION_KEY` environment variable values

Once this is done, you should be able to reset the test database and run specs:

```bash
yarn psy db:reset
yarn uspec
yarn fspec
```

#### **Did you find a bug?**

- **Do not open up a GitHub issue if the bug is a security vulnerability
  in Dream ORM**, and instead to refer to our [security policy](https://github.com/rvohealth/psychic/SECURITY.md).
- **Search for an existing Issue on our [Issues page](https://github.com/rvohealth/psychic/issues)**, since it is likely your issue was asked by someone else.
- **If you could not find your existing issue, please open [a new one](https://github.com/rvohealth/psychic/issues/new)**. Be sure to include relevant information, including:
  - Package version
  - Node version
  - Postgres version
  - TypeScript version
  - Description of the problem
  - Replicable code example

#### **Patching a bug?**

- Open [a new pull request on Github](https://github.com/rvohealth/psychic/pulls) with the patch.
- Ensure the PR description describes both the problem and solution, with an issue number attached (if relevant).

Thanks so much!

The Psychic team
