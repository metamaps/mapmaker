module.exports = {
/*	gruntfile: {
		files: '<%= jshint.gruntfile.src %>',
		tasks: ['jshint:gruntfile']
	},
	lib_test: {
		files: '<%= jshint.lib_test.src %>',
		tasks: ['jshint:lib_test', 'nodeunit']
	},*/
	client: {
		files: [
			'serve/index.html',
			'lib/**/*.js'
		],
		tasks: ['copy:serve'],
		options: {
			livereload: true
		}
  },
	express: {
		files: [
			'server/server.js'
		],
		tasks: ['express:devReload'],
		options: {
			livereload: true,
      spawn: false
		}
  },
};
