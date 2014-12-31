module.exports = {
	gruntfile: {
		files: '<%= jshint.gruntfile.src %>',
		tasks: ['jshint:gruntfile']
	},
	lib_test: {
		files: '<%= jshint.lib_test.src %>',
		tasks: ['jshint:lib_test', 'nodeunit']
	},
	serve: {
		files: [
			'serve/index.html',
			'lib/**/*.js'
		],
		tasks: ['copy:serve'],
		options: {
			livereload: true
		}
	}
};
