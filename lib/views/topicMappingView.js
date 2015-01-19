if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.TopicMappingView = (function($, famous) {
	var Engine = famous.core.Engine;
	var Surface = famous.core.Surface;
	var ImageSurface = famous.surfaces.ImageSurface;
	var StateModifier = famous.modifiers.StateModifier;
	var Transform = famous.core.Transform;

	var Handlers = {
		mousedown: function(event) {
			this.mouseIsDown = true;
			this.hasMoved = false;

			$(document).trigger(Mapmaker.TopicMappingView.events.mousedown);
		},
		mouseup: function(event) {
			Private.cancelClick.call(this);
			$(document).trigger(Mapmaker.TopicMappingView.events.mouseup, [this]);

			var storedTime = this.lastClick;
	        var now = Date.now();
	        this.lastClick = now;

			if (now - storedTime < this.view.config.DOUBLE_CLICK_TOLERANCE) {
				$(document).trigger(Mapmaker.TopicMappingView.events.doubleClick, [this]);
			}
		},
		mousemove: function(event) {
			var m = this.mapping;
			var newX, newY;

			if (this.mouseIsDown) {
				if (!this.hasMoved) this.hasMoved = true;

				newX = m.get("xloc") + event.movementX;
				newY = m.get("yloc") + event.movementY;
				// modify the mapping, the saved state
				m.set("xloc", newX);
				m.set("yloc", newY);

				this.mod.setTransform(Transform.translate(newX, newY, 0));

				// when changing this topics location, trigger event with location data
				// so that mapView can move synapses attached to it
			}
		}
	};

	var Private = {
		cancelClick: function() {
			this.mouseIsDown = false;

			if (this.hasMoved) {
				// save the mapping
			}

			$(document).trigger(Mapmaker.TopicMappingView.events.dragEnd);
		},
		createImageSurface: function() {
			var self = this;
			var topic = this.mapping.getTopic();

			var updateMetacodeImage = function() {
				var metacode = self.view.metacodes.get(topic.get("metacode_id"));
				var metacodeUrl = metacode.get("icon");
				self.imageSurface.setContent(metacodeUrl);
			};
			// add listener
			topic.on("change:metacode_id", updateMetacodeImage);

			this.imageSurface = new ImageSurface({
				classes: ["noselect"],
				size: [50, 50]
			});
			updateMetacodeImage();
			this.modNode.add(this.imageSurface);

			// attach events
			var mousedownHandler = function(event) {
				event.preventDefault();
				Handlers.mousedown.call(self, event);
			};
			this.imageSurface.on("mousedown", mousedownHandler);

			var mouseupHandler = function(event) {
				Handlers.mouseup.call(self, event);
			};
			this.imageSurface.on("mouseup", mouseupHandler);

			var mousemoveHandler = function(event) {
				Handlers.mousemove.call(self, event);
			};
			//this.imageSurface.on("mousemove", mousemoveHandler);
		},
		createNameSurface: function() {
			var self = this;
			var topic = this.mapping.getTopic();

			var updateName = function() {
				self.nameSurface.setContent(topic.get("name"));
			};
			// add listener
			topic.on("change:name", updateName);

			this.nameSurface = new Surface({
				content: topic.get("name"),
				classes: ["noselect"],
				size: [true, true],
				properties: {
					marginTop: "35px",
					borderRadius: "5px",
					backgroundColor: "#FFF"
				}
			});
			this.modNode.add(this.nameSurface);

			// attach events
			var mousedownHandler = function(event) {
				Handlers.mousedown.call(self, event);
			};
			this.nameSurface.on("mousedown", mousedownHandler);

			var mouseupHandler = function(event) {
				Handlers.mouseup.call(self, event);
			};
			this.nameSurface.on("mouseup", mouseupHandler);

			var mousemoveHandler = function(event) {
				Handlers.mousemove.call(self, event);
			};
			//this.nameSurface.on("mousemove", mousemoveHandler);
		}
	};

	var topicView = function(view, mapping) {
		var self = this;
		Mapmaker.MappingView.call(this, view, mapping);
		this.topic = mapping.getTopic();

		this.mod = new StateModifier({
			transform: Transform.translate(mapping.get("xloc"), mapping.get("yloc"), 0)
		});

		this.modNode = view.originModNode.add(this.mod);

		Private.createImageSurface.call(this);
		Private.createNameSurface.call(this);

		var cancelHandler = function(event) {
			Private.cancelClick.call(self, event);
		};
		Engine.on("mouseup", cancelHandler);

		var mousemoveHandler = function(event) {
			Handlers.mousemove.call(self, event);
		};
		Engine.on("mousemove", mousemoveHandler);

		this.mouseIsDown = false;
		this.lastClick = null;
		this.hasMoved = false;
	};

	topicView.prototype = new Mapmaker.MappingView();
	topicView.prototype.constructor = topicView;

	return topicView;
}(jQuery, famous));

/**
 * @class
 * @static
 */
Mapmaker.TopicMappingView.events = {
	mousedown: "Mapmaker:TopicMappingView:mousedown",
	mouseup: "Mapmaker:TopicMappingView:mouseup",
	doubleClick: "Mapmaker:TopicMappingView:doubleClick",
	dragEnd: "Mapmaker:TopicMappingView:dragEnd",
};
