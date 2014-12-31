module.exports = {
	serve: {
		files: [{
			src: 'dist/*',
			expand: true,
			dest: 'serve/js/',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'css/*',
			expand: true,
			dest: 'serve/css/',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'bower_components/**/*',
			expand: true,
			dest: 'serve/js/'
		}, {
			src: 'img/*',
			expand: true,
			dest: 'serve/img',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}]
	},
	deploy: {
		files: [{
			src: 'lib/**/*',
			expand: true,
			dest: 'deploy/maprenderer/static/js/ds/',
			flatten: true,
			nonull: true,
			filter: 'isFile'
		}, {
			src: 'css/*',
			expand: true,
			dest: 'deploy/maprenderer/static/css/',
			flatten: true,
			nonull: true,
			filter: 'isFile'
		}, {
			src: 'img/*',
			expand: true,
			dest: 'deploy/maprenderer/static/img/',
			flatten: true,
			nonull: true,
			filter: 'isFile'
		}, {
			src: 'dist/metamaps_renderer.js',
			dest: 'deploy/maprenderer/static/js/dist/metamaps_renderer.js'
		}]
	}
};
