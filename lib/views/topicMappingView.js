Metamaps.TopicMappingView = (function($) {
	var Engine = famous.core.Engine;
	var Surface = famous.core.Surface;
	var StateModifier = famous.modifiers.StateModifier;
	var Transform = famous.core.Transform;

	var Handlers = {
		mousedown: function(event) {
			this.mouseIsDown = true;

			$(document).trigger(Metamaps.TopicMappingView.events.mousedown);
		},
		mouseup: function(event) {
			this.mouseIsDown = false;

			if (this.hasMoved) {
				// save the mapping
			}

			$(document).trigger(Metamaps.TopicMappingView.events.mouseup);
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

			$(document).trigger(Metamaps.TopicMappingView.events.mouseup);
		},
		createImageSurface: function() {
			var self = this;
			var topic = this.mapping.getTopic();

			// add listener for the topic metacode_id changing,
			// call .setContent on the surface

			// this could be an ImageSurface
			this.imageSurface = new Surface({
			  content: "", // metacode image is going here
			  classes: ["noselect"],
			  size: [50, 50],
			  properties: {
			    backgroundColor: 'rgb(240, 238, 233)',
			    borderRadius: '25px'
			  }
			});
			this.modNode.add(this.imageSurface);

			// attach events
			var mousedownHandler = function(event) {
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

			// add listener for the topic name changing, 
			// call .setContent on the surface

			this.nameSurface = new Surface({
			  content: topic.get("name"),
			  classes: ["noselect"],
			  size: [true, true],
			  properties: {

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
	}

	var topicView = function(view, mapping) {
		var self = this;
		Metamaps.MappingView.call(this, view, mapping);
		this.topic = mapping.getTopic();

		this.mod = new StateModifier({
			transform: Transform.translate(mapping.get("xloc"), mapping.get("yloc"), 0)
		});

		this.modNode = view.originModNode.add(this.mod);

		Private.createImageSurface.call(this);
		Private.createNameSurface.call(this);

		var cancelHandler = function(event) {
			Private.cancelClick.call(self);
		};
		Engine.on("mouseup", cancelHandler);

		var mousemoveHandler = function(event) {
			Handlers.mousemove.call(self, event);
		};
		Engine.on("mousemove", mousemoveHandler);

		this.mouseIsDown = false;
		this.hasMoved = false;
	};

	topicView.prototype = new Metamaps.MappingView();
	topicView.prototype.constructor = topicView;

	return topicView;
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.TopicMappingView.events = {
	mousedown: "Metamaps:TopicMappingView:mousedown",
	mouseup: "Metamaps:TopicMappingView:mouseup"
};