if (typeof Mapmaker === 'undefined') Mapmaker = {};

/**
 * @static
 */
Mapmaker.buildMaker = (function($) {
	return {
		/**
		 * Creates a maker and it's underlying mapView object
		 * @method create
		 * @static
		 * @param {HTMLElement} canvasEl The DOM node to create the whole app in
		 * @param {Object} config The configuration object,
		 * see {@link Mapmaker.MapView#defaultConfig}
		 * @param {Object} map The map to display
		 */
		create: function(canvasEl, config, map) {
			var canvas = $(canvasEl);
			/* jshint newcap: false */

			var mapView = new Mapmaker.MapView(map, config, canvas);
			var maker = new Mapmaker.Maker(mapView, map);
			var canvasPos = canvas.css("position");
			//The 'canvas' must have either relative or absolute positioning
			if (canvasPos !== "absolute" && canvasPos !== "relative") {
				canvas.css("position", "relative");
			}

			return maker;
		}
	};
}(jQuery));
