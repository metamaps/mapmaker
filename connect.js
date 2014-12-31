module.exports =
{
	serveReload: {
		options: {
			debug: true,
			port: '8080',
			base: 'serve/',
			open: true,
			livereload: true
		}
	},
	serve: {
		options: {
			debug: true,
			port: '8080',
			base: 'serve/',
			open: true,
			keepalive: true
		}
	},
	serveNoOpen: {
		options: {
			debug: true,
			port: '8080',
			base: 'serve/',
			open: false,
			keepalive: true
		}
	}
};
