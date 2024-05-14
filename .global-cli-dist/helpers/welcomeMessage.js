"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const c = __importStar(require("colorette"));
function welcomeMessage(appName) {
    return `
  ${c.green(c.bold(c.italic(`Welcome to Psychic! What fortunes await your futures?\ncd into ${c.magentaBright(appName)} to find out!`)))}

  ${c.magenta(`to create a database,`)}
  ${c.magenta(`$ NODE_ENV=development yarn psy db:create`)}
  ${c.magenta(`$ NODE_ENV=test yarn psy db:create`)}

  ${c.magentaBright(`to migrate a database,`)}
  ${c.magentaBright(`$ NODE_ENV=development yarn psy db:migrate`)}
  ${c.magentaBright(`$ NODE_ENV=test yarn psy db:migrate`)}

  ${c.redBright(`to rollback a database,`)}
  ${c.redBright(`$ NODE_ENV=development yarn psy db:rollback`)}
  ${c.redBright(`$ NODE_ENV=test yarn psy db:rollback --step=1`)}

  ${c.blueBright(`to drop a database,`)}
  ${c.blueBright(`$ NODE_ENV=development yarn psy db:drop`)}
  ${c.blueBright(`$ NODE_ENV=test yarn psy db:drop`)}

  ${c.green(`to create a resource (model, migration, serializer, and controller)`)}
  ${c.green(`$ yarn psy g:resource api/v1/users user organization:belongs_to favorites:enum:favorite_foods:Chalupas,Other`)}

  # NOTE: doing it this way, you will still need to
  # plug the routes manually in your api/src/app/conf/routes.ts file

  ${c.greenBright(`to create a model`)}
  ${c.greenBright(`$ yarn psy g:model user organization:belongs_to likes_chalupas:boolean some_id:uuid`)}

  ${c.yellow(`to create a migration`)}
  ${c.yellow(`$ yarn psy g:migration create-users`)}

  ${c.yellowBright(`to start a dev server at http://localhost:7777,`)}
  ${c.yellowBright(`$ yarn psy dev`)}

  ${c.magentaBright(`to run unit tests,`)}
  ${c.magentaBright(`$ yarn psy uspec`)}

  ${c.magentaBright(`to run feature tests,`)}
  ${c.magentaBright(`$ yarn psy fspec`)}

  # NOTE: before you get started, be sure to visit your ${c.magenta('.env')} and ${c.magenta('.env.test')}
  # files and make sure they have database credentials set correctly.
  # you can see conf/dream.ts to see how those credentials are used.
    `;
}
exports.default = welcomeMessage;
