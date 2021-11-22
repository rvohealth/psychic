import store from 'psy/store'

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

    default:
      return null
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

const withForm = (action, cb) => {
  const data = {}
  action = new Action(action)

  class PsyForm {
    static blank(opts) {
      return <div>{opts.children}</div>
    }

    static checkbox(opts) {
      return input({
        ...opts,
        type: 'checkbox',
      })
    }

    static color(opts) {
      return input({
        ...opts,
        type: 'color',
      })
    }

    static date(opts) {
      // TODO: build out date selector component
      return (
        <div>
        </div>
      )
    }

    static datetime(opts) {
      // TODO: build out datetime selector component
      return (
        <div>
        </div>
      )
    }

    static email(opts={}) {
      return input({
        type: 'email',
        ...opts,
      })
    }

    static hidden(opts) {
      return input({
        type: 'hidden',
        ...opts,
      })
    }

    static input(opts={}) {
      return input(opts)
    }

    static label(opts) {
      return (
        <label
          for={opts.name}
          {...opts}
        >
          {opts.children}
        </label>
      )
    }

    static month(opts) {
      // TODO: build out month selector component
      return (
        <div>
        </div>
      )
    }

    static number(opts) {
      return input({
        type: 'number',
        ...opts,
      })
    }

    static password(opts) {
      return input({
        ...opts,
        type: 'password',
      })
    }

    static phone(opts) {
      return input({
        type: 'tel',
        ...opts,
      })
    }

    static range(opts) {
      return input({
        ...opts,
        type: 'range',
      })
    }

    static radio(opts) {
      return input({
        ...opts,
        type: 'radio',
      })
    }

    static search(opts) {
      return input({
        ...opts,
        type: 'text',
      })
    }

    static tel(opts) {
      return input({
        type: 'tel',
        ...opts,
      })
    }

    static text(opts) {
      return input(opts)
    }

    static time(opts) {
      // TODO: build out time selector component
      return (
        <div>
        </div>
      )
    }

    static submit(opts) {
      return (
        <button
          onClick={ () => {
            send()
          }}
        >{opts.text || 'Submit'}</button>
      )
    }

    static url(opts) {
      return input({
        type: 'url',
        ...opts,
      })
    }
  }

  function input(opts) {
    const type = opts.type || 'text'
    return (
      <input
        type={type}
        name={opts.name}
        onChange={ event => {
          data[opts.name] = event.target.value
          store?.dispatch({
            type: `${action.path}#merge`,
            payload: {
              [opts.name]: event.target.value,
            },
          })
        }}
        {...opts}
      />
    )
  }

  function send() {
    store?.dispatch({
      type: action.string,
      payload: data,
    })
  }

  return cb(PsyForm)
}

export default withForm
