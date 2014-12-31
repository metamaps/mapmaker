Metamaps.MapView = (function($) {
	/**
	 * Default configuration object. Not actually accessible
	 * @member Metamaps.MapView
	 * @protected
	 */
	var defaultConfig = {};
		

	var Private = {
		someFunction: function() {
			
		}
	};

	var Handlers = {
		onCanvasClick: function() {

		}
	};

	/**
	 * Object providing an interface to drawing to the screen
	 * @class Metamaps.MapView
	 * @param {Object} config Configuration options, must be at least an empty
	 * object {@link Metamaps.MapView#defaultConfig}
	 * @param {Object} paper The Raphael paper object
	 * @param {jQuery} $parent Jquery object pointing to the 'parent' element
	 * in the dom, and UI DOM elements created will be rooted here.
	 */
	var mapView = function(config, paper, $parent) {
		/**
		 * The Raphael paper object
		 * @property {Raphael.Paper}
		 */
		this.paper = paper;
		/**
		 * representation of the parent DOM element
		 * @property {jQuery}
		 */
		this.$parent = $parent;
		this.parseConfig(config);
		/**
		 * The current map
		 * @property {Metamaps.Map}
		 */
		this.currentMap = null;

		this.subscribeEvents();
	};

	mapView.prototype.subscribeEvents = function() {
		var self = this;
		var canvasClick = function(e) {
			Handlers.onCanvasClick.call(self, e, $(this));
		};
		this.$parent.on("click", canvasClick);
		
		/*$(document).on(Metamaps.MappingView.events.mouseDown, function(event, mappingView) {
			Handlers.onMappingMouseDown.call(self, mappingView);
		});*/
	};

	/**
	 * Parses and sets current configuration
	 * @param {Object} config The configration object, defaults will be applied.
	 * See {@link Metamaps.MapView#defaultConfig}
	 */
	mapView.prototype.parseConfig = function(config) {
		Metamaps.Utility.extendIf(config, defaultConfig);
		this.config = config;
		//If we have a room loaded, reparse/redraw for any changed
		//color values
		//this.draw();
	};

	return mapView;
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.MapView.events = {
	mappingSelected: "Metamaps:MapView:mappingSelected"
};
