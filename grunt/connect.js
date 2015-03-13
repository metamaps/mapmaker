module.exports = {
	serveReload: {
		options: {
			'debug': false,
			'port': '4000',
			'base': 'serve/',
			open: true,
			keepalive: false,
			livereload: true
		}
	},
	serve: {
		options: {
			debug: true,
			port: '4000',
			base: 'serve/',
			open: false,
			keepalive: false
		}
	},
	serveNoOpen: {
		options: {
			debug: true,
			port: '4000',
			base: 'serve/',
			open: false,
			keepalive: true
		}
	}
};
