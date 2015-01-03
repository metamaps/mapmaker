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
		},
		DOUBLE_CLICK_TOLERANCE: 300
	};


	var Private = {
		createViews: function() {
			//
			this.infoBox = new Metamaps.MapInfoBoxView({
				model: this.currentMap,
				mapView: this
			});

			//
			this.filter = new Metamaps.FilterView({
				mapView: this
			});

			//
			this.junto = new Metamaps.JuntoView({
				mapView: this
			});

			//
			this.newTopic = new Metamaps.NewTopicView({
				mapView: this
			});

			//
			this.newSynapse = new Metamaps.NewSynapseView({
				mapView: this
			});
		},
		createGraphContainer: function() {
			// create the main context
			this.$graphContainer = $(document.createElement("div"));
			this.$graphContainer
				.attr("id", "graphContainer")
				.css({
					"overflow": "hidden",
					"position": "absolute",
					"top": "0"
				})
				.width(this.$parent.width())
				.height(this.$parent.height())
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
		},
		subscribeEvents: function() {
			var self = this;

			/*
				these events (using "Engine") are bad because they're not being contained to the container
			*/
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

			// subscribe to collection events
			var synapses = this.currentMap.get("synapseMappings");
			synapses.bind("add", this.addSynapseMappingView);
			synapses.bind("remove", this.removeSynapseMappingView);

			var topics = this.currentMap.get("topicMappings");
			topics.bind("add", this.addTopicMappingView);
			topics.bind("remove", this.removeTopicMappingView);

			// for JuntoView
			$(document).on(Metamaps.JuntoView.events.turnOn, function(event) {
				
			});
			$(document).on(Metamaps.JuntoView.events.turnOff, function(event) {
				
			});

			// for FilterView
			$(document).on(Metamaps.FilterView.events.change, function(event) {
				
			});

			// for NewTopicView
			$(document).on(Metamaps.NewTopicView.events.create, function(event, data) {
				
			});

			// for NewSynapseView
			$(document).on(Metamaps.NewSynapseView.events.create, function(event, data) {
				
			});	

			// for TopicMappingView
			$(document).on(Metamaps.TopicMappingView.events.mousedown, function(event) {
				Handlers.topicMousedown.call(self);
			});
			$(document).on(Metamaps.TopicMappingView.events.mouseup, function(event, topicMappingView) {
				Handlers.topicMouseup.call(self, topicMappingView);
			});
			$(document).on(Metamaps.TopicMappingView.events.doubleClick, function(event, topicMappingView) {
				Handlers.topicDoubleClick.call(self, topicMappingView);
			});
			$(document).on(Metamaps.TopicMappingView.events.dragEnd, function(event) {
				Handlers.topicDragEnd.call(self);
			});
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
				Private.loadGraph.call(self);
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
			
		},
		topicDoubleClick: function(topicMappingView) {
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
	 * @param {Metamaps.Map} map The map to create a view for
	 * @param {Object} config Configuration options, must be at least an empty
	 * object {@link Metamaps.MapView#defaultConfig}
	 * @param {jQuery} $parent Jquery object pointing to the 'parent' element
	 * in the dom, and UI DOM elements created will be rooted here.
	 */
	var mapView = function(map, config, $parent) {

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
		this.currentMap = map;

		/**
		 * The collection of metacodes to use
		 * @property {Metamaps.MetacodeCollection}
		 */
		this.metacodes = null;

		// these use the id of the topic or synapse as keys
		this.topicCards = {};
		this.synapseCards = {};

		// these store the topicMappingView and synapseMappingView views
		this.topics = {};
		this.synapses = {};

		this.mouseIsDown = false;
		this.draggingTopic = false;

		Private.createViews.call(this);
		Private.createGraphContainer.call(this);
		Private.getMetacodes.call(this, this.config.paths.metacodes);
		Private.subscribeEvents.call(this);
	};

	/**
	 * Parses and sets current configuration
	 * @param {Object} config The configration object, defaults will be applied.
	 * See {@link Metamaps.MapView#defaultConfig}
	 */
	mapView.prototype.parseConfig = function(config) {
		Metamaps.Utility.extendIf(config, defaultConfig);
		this.config = config;
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
