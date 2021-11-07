import {
  goto,
  fillIn,
  find,
  click,
} from 'src/psyspec/story/helpers/browser'

global.click = click
global.fillIn = fillIn
global.find = find
global.goto = goto
global.baseUrl = 'http://localhost:33333'
