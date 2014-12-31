var baseVendor = [
	'bower_components/jquery/dist/jquery.min.js',
	'lib/utility.js'
];
module.exports = {
	options: {
		keepRunner: true
	},
	utility: {
		src: ['lib/utility.js'],
		options: {
			specs: ['spec/utilitySpec.js']
		}
	},
	renderer: {
		src: 'lib/renderer.js',
		options: {
			vendor: baseVendor,
			specs: 'spec/rendererSpec.js'
		}
	}
};
