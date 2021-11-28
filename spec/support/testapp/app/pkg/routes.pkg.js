export default {
  testget: 'testget',
  testpost: 'testpost',
  testput: 'testput',
  testpatch: 'testpatch',
  testdelete: 'testdelete',
  testUsers: {
    index: 'test-users',
    show: id => `test-users/${id}`,
    create: 'test-users',
    update: id => `test-users/${id}`,
    delete: id => `test-users/${id}`,
  },
  testapi: {
    v1: {
      namespacetest: 'testapi/v1/namespacetest',
      testUsers: {
        index: 'testapi/v1/test-users',
        show: id => `testapi/v1/test-users/${id}`,
        create: 'testapi/v1/test-users',
        update: id => `testapi/v1/test-users/${id}`,
        delete: id => `testapi/v1/test-users/${id}`,
      },
    },
  },
}
