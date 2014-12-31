/**
 * @static
 */
Metamaps.MapRendererFactory = (function($, Snap) {
	var setCanvasSize = function(canvas, paper) {
		paper.attr({
			width: canvas.innerWidth() + "px",
			height: canvas.innerHeight() + "px"
		});
	};
	var canvasResize = function(canvas, paper, mapView) {
		paper.attr({
			width: canvas.innerWidth() + "px",
			height: canvas.innerHeight() + "px"
		});
	};
	return {
		/**
		 * Creates a renderer and it's underlying roomView object
		 * @method create
		 * @static
		 * @param {HTMLElement} canvasEl The DOM node to create the 'paper' object in
		 * @param {Object} config The configuration object,
		 * see {@link DS.RoomView#defaultConfig}
		 * @param {Object} [room] The room object to parse. See
		 * {@link DS.Room}
		 */
		create: function(canvasEl, config, map) {
			var canvas = $(canvasEl);
			/* jshint newcap: false */
			var xmlns = "http://www.w3.org/2000/svg";
			var svgEl = document.createElementNS(xmlns, "svg");
			canvasEl.appendChild(svgEl);
			var paper = Snap(svgEl);
			setCanvasSize(canvas, paper);
			
			var mapView = new Metamaps.MapView(config, paper, canvas);
			var renderer = new Metamaps.MapRenderer(mapView, map);
			var canvasPos = canvas.css("position");
			//The 'canvas' must have either relative or absolute positioning
			if (canvasPos !== "absolute" && canvasPos !== "relative") {
				canvas.css("position", "relative");
			}
			$(window).on("resize", function() {
				canvasResize(canvas, paper, mapView);
			});

			return renderer;
		}
	};
}(jQuery, Snap));
