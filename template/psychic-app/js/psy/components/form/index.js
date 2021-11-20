import get from 'lodash'
import store from 'psy/store'

export default function withForm(action, cb) {
  return cb(new PsyForm(action))
}

class PsyForm {
  constructor(action) {
    this.action = new Action(action)
    this.data = {}
  }

  blank(opts) {
    return <div>{opts.children}</div>
  }

  checkbox(opts) {
    return this.input({
      ...opts,
      type: 'checkbox',
    })
  }

  color(opts) {
    return this.input({
      ...opts,
      type: 'color',
    })
  }

  date(opts) {
    // TODO: build out date selector component
    return (
      <div>
        ${this.hidden(opts)}
      </div>
    )
  }

  datetime(opts) {
    // TODO: build out datetime selector component
    return (
      <div>
        ${this.hidden(opts)}
      </div>
    )
  }

  email(opts) {
    return this.input({
      type: 'email',
      ...opts,
    })
  }

  hidden(opts) {
    return this.input({
      type: 'hidden',
      ...opts,
    })
  }

  input(opts) {
    const type = opts.type || 'text'
    return (
      <input
        type={type}
        name={opts.name}
        onChange={ event => {
          this.data[opts.name] = event.target.value
          store?.dispatch({
            type: `${this.action.path}#merge`,
            payload: {
              [opts.name]: event.target.value,
            },
          })
        }}
        {...opts}
      />
    )
  }

  label(opts) {
    return (
      <label
        for={opts.name}
        {...opts}
      >
        {opts.children}
      </label>
    )
  }

  month(opts) {
    // TODO: build out month selector component
    return (
      <div>
        ${this.hidden(opts)}
      </div>
    )
  }

  number(opts) {
    return this.input({
      type: 'number',
      ...opts,
    })
  }

  password(opts) {
    return this.input({
      ...opts,
      type: 'password',
    })
  }

  phone(opts) {
    return this.input({
      type: 'tel',
      ...opts,
    })
  }

  range(opts) {
    return this.input({
      ...opts,
      type: 'range',
    })
  }

  radio(opts) {
    return this.input({
      ...opts,
      type: 'radio',
    })
  }

  search(opts) {
    return this.input({
      ...opts,
      type: 'text',
    })
  }

  tel(opts) {
    return this.phone(opts)
  }

  text(opts) {
    return this.input(opts)
  }

  time(opts) {
    // TODO: build out time selector component
    return (
      <div>
        ${this.hidden(opts)}
      </div>
    )
  }

  send() {
    store?.dispatch({
      type: this.action.string,
      payload: this.data,
    })
  }

  submit(opts) {
    return (
      <button
        onClick={ () => {
          this.send()
        }}
      >{opts.text || 'Submit'}</button>
    )
  }

  url(opts) {
    return this.input({
      type: 'url',
      ...opts,
    })
  }
}

class Action {
  get changeType() {
    switch(this.method) {
    case 'create':
    case 'update':
      return 'update'

    case 'show':
      return 'set'

    case 'index':
      return 'filter'

    case 'delete':
      return 'delete'
    }
  }

  get path() {
    return this.string.split('#').first
  }

  get method() {
    return this.string.split('#').second
  }

  constructor(actionString) {
    this.string = actionString
  }
}
