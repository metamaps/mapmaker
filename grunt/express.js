module.exports = {
  //options: {
    // Override defaults here
  //},
  dev: {
    options: {
      script: './server/server.js',
      background: false
    }
  },
  devReload: {
    options: {
      script: './server/server.js',
      background: true
    }
  },
  prod: {
    options: {
      script: 'path/to/prod/server.js',
      node_env: 'production'
    }
  }
}
