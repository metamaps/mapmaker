module.exports = {
	"default": {
		options: {
			compress: false,
			paths: "less/"
		},
		files: {
			 "css/metamapsMapRender.css": "less/metamapsMapRenderer.less"
		}
	},
	dist: {
		options: {
			compress: true,
			paths: "less/"
		},
		files: {
			"css/metamapsMapRender.css": "less/metamapsMapRenderer.less"
		}
	}
};
