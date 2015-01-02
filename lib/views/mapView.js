Metamaps.MapView = (function($, famous) {

	// import famous
	var Engine = famous.core.Engine;
	var Surface = famous.core.Surface;
	var StateModifier = famous.modifiers.StateModifier;
	var Transform = famous.core.Transform;
	var Easing = famous.transitions.Easing;


	/**
	 * Default configuration object. Not actually accessible
	 * @member Metamaps.MapView
	 * @protected
	 */
	var defaultConfig = {
		paths: {
			metacodes: "/json/metacodes/metacodes.json"
		}
	};


	var Private = {
		attemptLoad: function() {
			if (this.metacodes && this.currentMap) {
				Private.loadGraph.call(this);
			}
		},
		loadGraph: function() {
			var self = this;

			// draw the synapses first
			var synapses = this.currentMap.get("synapseMappings");
			//self.addSynapseMappingView(synapses.models[0]);
			synapses.each(function(synapseMapping) {
				self.addSynapseMappingView(synapseMapping);
			});

			// draw the topics second
			var topics = this.currentMap.get("topicMappings");
			topics.each(function(topicMapping) {
				self.addTopicMappingView(topicMapping);
				/*
				// animating
				self.topics[topicMapping.cid].mod.setTransform(Transform.translate(0,0,0));
				self.topics[topicMapping.cid].mod.setTransform(
					Transform.translate(topicMapping.get("xloc"),topicMapping.get("yloc"),0),
	            	{curve: Easing.inOutCubic, duration: 1000}
	           	);*/
			});
		},
		getMetacodes: function(path) {
			var self = this;

			var start = function(data) {
				self.metacodes = new Metamaps.MetacodeCollection(data);
				Private.attemptLoad.call(self);
			};

			$.ajax({
				url: path,
				success: start
			});
		}
	};

	var Handlers = {
		mousedown: function(event) {
			this.mouseIsDown = true;
		},
		mouseup: function(event) {
			this.mouseIsDown = false;
		},
		mousemove: function(event) {
			var newTransform;

			if (this.mouseIsDown && !this.draggingTopic) {
				this.translateX = this.translateX + event.movementX;
				this.translateY = this.translateY + event.movementY;
				newTransform = Transform.translate(this.translateX, this.translateY, 0);
				this.translateModifier.setTransform(newTransform);
			}
		},
		topicMousedown: function() {
			this.draggingTopic = true;
		},
		topicMouseup: function(topicMappingView) {
			var topic = topicMappingView.topic;

			// display a topic card
			if (!this.topicCards[topic.id]) {
				this.topicCards[topic.id] = new Metamaps.TopicCardView({
					model: topic,
					mapView: this
				});
			}
			this.topicCards[topic.id].show();
		},
		topicDragEnd: function() {
			this.draggingTopic = false;
		}
	};

	/**
	 * Object providing an interface to drawing to the screen
	 * @class Metamaps.MapView
	 * @param {Object} config Configuration options, must be at least an empty
	 * object {@link Metamaps.MapView#defaultConfig}
	 * @param {jQuery} $parent Jquery object pointing to the 'parent' element
	 * in the dom, and UI DOM elements created will be rooted here.
	 */
	var mapView = function(config, $parent) {

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

		/**
		 * The collection of metacodes to use
		 * @property {Metamaps.MetacodeCollection}
		 */
		this.metacodes = null;

		//
		this.infoBox = new Metamaps.MapInfoBoxView(this);

		//
		this.topicCards = {};

		//
		this.synapseCards = {};

		//
		this.filter = new Metamaps.FilterView(this);

		//
		this.junto = new Metamaps.JuntoView(this);

		//
		this.newTopic = new Metamaps.NewTopicView(this);

		//
		this.newSynapse = new Metamaps.NewSynapseView(this);

		//
		this.topics = {};

		//
		this.synapses = {};

		// create the main context
		this.$graphContainer = $(document.createElement("div"));
		this.$graphContainer
			.attr("id", "graphContainer")
			.css({
				"overflow": "hidden",
				"position": "absolute",
				"top": "0"
			})
			.width($parent.width())
			.height($parent.height())
			.appendTo(this.$parent);

		this.mainContext = Engine.createContext(this.$graphContainer[0]);

		this.translateX = this.translateY = 0;
		this.translateModifier = new StateModifier({
			transform: Transform.translate(this.translateX, this.translateY, 0)
		});
		this.translateModNode = this.mainContext.add(this.translateModifier);

		var originModifier = new StateModifier({
			origin: [0.5, 0.5],
			align: [0.5, 0.5]
		});
		this.originModNode = this.translateModNode.add(originModifier);

		this.mouseIsDown = false;
		this.draggingTopic = false;

		Private.getMetacodes.call(this, this.config.paths.metacodes);

		this.subscribeEvents();
	};

	mapView.prototype.setCurrentMap = function(map) {
		this.currentMap = map;

		var synapses = this.currentMap.get("synapseMappings");
		synapses.bind("add", this.addSynapseMappingView);
		synapses.bind("remove", this.removeSynapseMappingView);

		var topics = this.currentMap.get("topicMappings");
		topics.bind("add", this.addTopicMappingView);
		topics.bind("remove", this.removeTopicMappingView);

		Private.attemptLoad.call(this);
	};

	mapView.prototype.subscribeEvents = function() {
		var self = this;

		var mousedownHandler = function(event) {
			Handlers.mousedown.call(self, event);
		};
		Engine.on("mousedown", mousedownHandler);

		var mouseupHandler = function(event) {
			Handlers.mouseup.call(self, event);
		};
		Engine.on("mouseup", mouseupHandler);

		var mousemoveHandler = function(event) {
			Handlers.mousemove.call(self, event);
		};
		Engine.on("mousemove", mousemoveHandler);

		$(document).on(Metamaps.TopicMappingView.events.mousedown, function(event) {
			Handlers.topicMousedown.call(self);
		});
		$(document).on(Metamaps.TopicMappingView.events.mouseup, function(event, topicMappingView) {
			Handlers.topicMouseup.call(self, topicMappingView);
		});
		$(document).on(Metamaps.TopicMappingView.events.dragEnd, function(event) {
			Handlers.topicDragEnd.call(self);
		});
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


	mapView.prototype.addTopicMappingView = function(mapping) {
		var view = new Metamaps.TopicMappingView(this, mapping);
		this.topics[mapping.cid] = view;
	};

	mapView.prototype.removeTopicMappingView = function(mapping) {
		this.topics[mapping.cid].remove();
		delete this.topics[mapping.cid];
	};

	mapView.prototype.addSynapseMappingView = function(mapping) {
		var view = new Metamaps.SynapseMappingView(this, mapping);
		this.synapses[mapping.cid] = view;
	};

	mapView.prototype.removeSynapseMappingView = function(mapping) {
		this.synapses[mapping.cid].remove();
		delete this.synapses[mapping.cid];
	};

	return mapView;
}(jQuery, famous));

/**
 * @class
 * @static
 */
Metamaps.MapView.events = {
	mappingSelected: "Metamaps:MapView:mappingSelected"
};
