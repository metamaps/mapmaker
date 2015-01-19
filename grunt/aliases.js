module.exports = {
	'default': [
		'jshint',
		'jasmine',
		'concat',
		'uglify'
	],
	dist: [
		'jshint',
		'jasmine',
		'concat:dist',
		'uglify:dist',
		'less:dist'
	],
	preCommit: [
		'jsbeautifier',
		'jshint',
		'jasmine'
	],
	serve: [
		'clean:serve',
		'concat',
		'less:default',
		'copy:serve',
		'connect:serve'
	],
	serveNoOpen: [
		'clean:serve',
		'concat',
		'less:default',
		'copy:serve',
		'connect:serveNoOpen'
	],
	serveReload: [
		'clean:serve',
		'concat',
		'less:default',
		'copy:serve',
		'watch:serve',
		'connect:serveReload'
	],
	deploy: [
		'jasmine',
		'jshint',
		'clean:deploy',
		'concat',
		'less:dist',
		'uglify',
		'copy:deploy'
	]
};
