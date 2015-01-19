Mapmaker.SynapseMappingView = (function($, famous) {
	var Engine = famous.core.Engine;
	var Surface = famous.core.Surface;
	var Modifier = famous.core.Modifier;
	var StateModifier = famous.modifiers.StateModifier;
	var Transform = famous.core.Transform;

	var Handlers = {
		mousedown: function(event) {
			this.mouseIsDown = true;

			$(document).trigger(Mapmaker.SynapseMappingView.events.mousedown);
		},
		mouseup: function(event) {
			this.mouseIsDown = false;

			$(document).trigger(Mapmaker.SynapseMappingView.events.mouseup);
		}
	};

	var Private = {
		calculateLength: function() {
			var pointA = [this.topicMapping1.get("xloc"), this.topicMapping1.get("yloc")];
			var pointB = [this.topicMapping2.get("xloc"), this.topicMapping2.get("yloc")];

			var xSquared = Math.pow((pointA[0] - pointB[0]), 2);
			var ySquared = Math.pow((pointA[1] - pointB[1]), 2);

			this.length = Math.sqrt(xSquared + ySquared);
		},
		cancelClick: function() {
			this.mouseIsDown = false;

			$(document).trigger(Mapmaker.SynapseMappingView.events.mouseup);
		},
		createLineSurface: function() {
			var self = this;

			// add listener for the synapse direction changing,
			// call .setContent on the surface

			this.lineSurface = new Surface({
				content: "",
				classes: ["noselect"],
				size: [1, 1],
				properties: {
					backgroundColor: "#000"
				}
			});
			this.modNode.add(this.lineSurface);

			// attach events
			var mousedownHandler = function(event) {
				Handlers.mousedown.call(self, event);
			};
			this.lineSurface.on("mousedown", mousedownHandler);

			var mouseupHandler = function(event) {
				Handlers.mouseup.call(self, event);
			};
			this.lineSurface.on("mouseup", mouseupHandler);
		},
		updateDisplay: function() {
			var pointA = [this.topicMapping1.get("xloc"), this.topicMapping1.get("yloc")];
			var pointB = [this.topicMapping2.get("xloc"), this.topicMapping2.get("yloc")];

			// scale
			Private.calculateLength.call(this);
			this.lineSurface.setSize([this.length, 1]);

			// rotate
			var deltaX = pointA[0] - pointB[0];
			var deltaY = pointA[1] - pointB[1];
			var radians = Math.atan2(deltaY, deltaX);
			var r = Transform.rotateZ(radians);

			// translate (to the center point of the line between pointA and pointB)
			var centerX = pointA[0] + (pointB[0] - pointA[0]) / 2;
			var centerY = pointA[1] + (pointB[1] - pointA[1]) / 2;
			var t = Transform.translate(centerX, centerY, 0);

			var finalTransform = Transform.multiply(t, r);
			this.mod.setTransform(finalTransform);

		}
	};

	var synapseView = function(view, mapping) {
		var self = this;
		Mapmaker.MappingView.call(this, view, mapping);
		this.synapse = mapping.getSynapse();
		this.topicMapping1 = this.synapse.getTopicMapping1();
		this.topicMapping2 = this.synapse.getTopicMapping2();

		this.topicMapping1.on("change:xloc, change:yloc", function() {
			Private.updateDisplay.call(self);
		});
		this.topicMapping2.on("change:xloc, change:yloc", function() {
			Private.updateDisplay.call(self);
		});

		this.length = 0;
		Private.calculateLength.call(this);

		this.mod = new StateModifier({
			transform: Transform.translate(0, 0, 0)
		});
		this.modNode = view.originModNode.add(this.mod);

		Private.createLineSurface.call(this);

		var cancelHandler = function(event) {
			Private.cancelClick.call(self);
		};
		Engine.on("mouseup", cancelHandler);

		this.mouseIsDown = false;

		Private.updateDisplay.call(this);
	};

	synapseView.prototype = new Mapmaker.MappingView();
	synapseView.prototype.constructor = synapseView;


	return synapseView;
}(jQuery, famous));

/**
 * @class
 * @static
 */
Mapmaker.SynapseMappingView.events = {
	mousedown: "Mapmaker:SynapseMappingView:mousedown",
	mouseup: "Mapmaker:SynapseMappingView:mouseup"
};
