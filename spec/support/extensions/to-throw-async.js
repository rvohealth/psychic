expect.extend({
  async toThrowAsync(received, errorClass=null) {
    const successMessage = {
      pass: true,
      message: `Expected and received ${errorClass?.constructor?.name || 'error'}`,
    }

    let error
    try {
      await received()
    } catch (err) {
      error = err
    }

    if (!error) return {
      pass: false,
      message: `Expected ${errorClass.constructor.name || 'an error'}, but no error was raised`
    }

    if (!errorClass) return successMessage
    if (error.constructor === errorClass) return successMessage

    return {
      pass: false,
      message: `Expected ${errorClass.constructor.name}, received ${error.constructor.name}`,
    }
  }
})

