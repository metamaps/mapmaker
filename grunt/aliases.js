module.exports = {
	'default': [
		'jshint',
		'jasmine',
		'concat',
		'uglify'
	],
	init: [
		'copy:init',
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
		'connect:serve',
		'express:dev'
	],
	serveReload: [
		'clean:serve',
		'concat',
		'less:default',
		'copy:serve',
		'connect:serveReload',
		'express:devReload',
		'watch'
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
