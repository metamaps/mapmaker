Metamaps.MapRenderer = (function($) {

	/**
	 * The public interface for the map renderer component
	 * @class DS.MapRenderer
	 * @param {DS.RoomView} view
	 * @param {Object} room
	 */
	var MapRenderer = function(view, map) {
		/**
		 * The view object associated with the renderer
		 * @property {Object}
		 */
		this.view = view;
		/**
		 * The renderer's current map
		 * @property {Metamaps.Map}
		 */
		this.map = map;

		this.view.setCurrentMap(this.map);
	};

	MapRenderer.prototype.test = function() {

	};

	return MapRenderer;
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.MapRenderer.events = {
	/**
	 * Fired whenever the map definition changes
	 * @event
	 */
	mapChanged: "Metamaps:mapChanged"
};
