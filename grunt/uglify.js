module.exports =
{
	options: {
		banner: '<%= banner %>'
	},
	dist: {
		src: '<%= concat.dist.dest %>',
		dest: 'dist/metamaps_renderer.min.js'
	}
};
