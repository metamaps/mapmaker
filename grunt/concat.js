module.exports = {
	options: {
		banner: '<%= banner %>',
		stripBanners: true,
	},
	dist: {
		src: [
			'bower_components/snap.svg/dist/snap.svg-min.js',
			'bower_components/underscore/underscore.js',
			'bower_components/backbone/backbone.js',
			'bower_components/Countable/Countable.js',
			'bower_components/socket.io-client/socket.io.js',
			'bower_components/typeahead.js/dist/typeahead.bundle.min.js',
			'bower_components/CloudCarousel/cloudcarousel.js',
			'bower_components/embedly/embedly.js',
			'lib/utility.js',
			'lib/metacode.js',
			'lib/mapping.js',
			'lib/mappingView.js',
			'lib/topic.js',
			'lib/topicMappingView.js',
			'lib/topicCardView.js',
			'lib/synapse.js',
			'lib/synapseMappingView.js',
			'lib/synapseCardView.js',
			'lib/map.js',
			'lib/mapView.js',
			'lib/mapper.js',
			'lib/renderer.js',
			'lib/factory.js',
			'lib/collections.js',
		],
		dest: 'dist/metamaps_renderer.js'
	}
};
