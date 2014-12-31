module.exports = {
	dist: {
		src: ['lib/*.js'],
		dest: 'doc',
		options: {
			external: 'jQuery, Raphael, Raphael.Paper'
		}
	}
};
