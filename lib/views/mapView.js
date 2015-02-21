if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.MapView = (function($, famous) {

	// import famous
	var Engine = famous.core.Engine;
  var PhysicsEngine = famous.physics.PhysicsEngine;
	var Surface = famous.core.Surface;
	var StateModifier = famous.modifiers.StateModifier;
	var Transform = famous.core.Transform;
	var Easing = famous.transitions.Easing;


	/**
	 * Default configuration object. Not actually accessible
	 * @member Mapmaker.MapView
	 * @protected
	 */
	var defaultConfig = {
		paths: {
			metacodes: "/json/metacodes/metacodes.json"
		},
		DOUBLE_CLICK_TOLERANCE: 300,
		embed: false, // indicates that the app is on a page that is optimized for embedding in iFrames on other web pages
    sandbox: false, // puts the app into a mode (when true) where it only creates data locally, and isn't writing it to the database
    colors: {
        background: '#344A58',
        synapses: {
            normal: '#888888',
            hover: '#888888',
            selected: '#FFFFFF'
        },
        topics: {
            selected: '#FFFFFF'
        },
        labels: {
            background: '#18202E',
            text: '#DDD'
        }
    }
	};


	var Private = {
		addModules: function () {

			this.Create = new Mapmaker.Create(this);
			this.Control = new Mapmaker.Control(this);
			this.Realtime = new Mapmaker.Realtime(this);
			this.Visualize = new Mapmaker.Visualize(this);
			this.JIT = new Mapmaker.JIT(this);
		},
		createViews: function () {
			//
			this.infoBox = new Mapmaker.MapInfoBoxView({
				model: this.currentMap,
				mapView: this
			});

			//
			this.filter = new Mapmaker.FilterView({
				mapView: this
			});

			//
			this.junto = new Mapmaker.JuntoView({
				mapView: this
			});

			//
			this.newTopic = new Mapmaker.NewTopicView({
				mapView: this
			});
      this.$parent.append(this.newTopic.render().el);

			//
			this.newSynapse = new Mapmaker.NewSynapseView({
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

      this.pe = new PhysicsEngine();
		},
		subscribeEvents: function() {
			var self = this;

			$(document).on('keydown', function (e) {
            
            switch (e.which) {
            case 13: // if enter key is pressed
                self.JIT.enterKeyHandler();
                e.preventDefault();
                break;
            case 27: // if esc key is pressed
                self.JIT.escKeyHandler();
                break;
            case 65: //if a or A is pressed
                if (e.ctrlKey){
                    self.Control.deselectAllNodes();
                    self.Control.deselectAllEdges();

                    e.preventDefault();
                    self.Visualize.mGraph.graph.eachNode(function (n) {
                        self.Control.selectNode(n,e);
                    });

                    self.Visualize.mGraph.plot();
                }
                
                break;
            case 69: //if e or E is pressed
                if (e.ctrlKey){
                    e.preventDefault();
                    if (Mapmaker.Active.Map) {
                        Mapmaker.JIT.zoomExtents(null, Mapmaker.Visualize.mGraph.canvas);
                    }
                }
                break;
            case 77: //if m or M is pressed
                if (e.ctrlKey){
                    e.preventDefault();
                    self.Control.removeSelectedNodes();
                    self.Control.removeSelectedEdges();
                }
                break;
            case 68: //if d or D is pressed
                if (e.ctrlKey){
                    e.preventDefault();
                    self.Control.deleteSelected();
                }
                break;
            case 72: //if h or H is pressed
                if (e.ctrlKey){
                    e.preventDefault();
                    self.Control.hideSelectedNodes();
                    self.Control.hideSelectedEdges();
                }
                break;
            case 67: // c
            	self.newTopic.toggle();
            	break;
            default:
                //alert(e.which);
                break;
            }
        });

        $(window).resize(function () {
            if (self.Visualize && self.Visualize.mGraph) self.Visualize.mGraph.canvas.resize($(window).width(), $(window).height());
            
            // TODO move this into the metamaps repo
            //if ((Mapmaker.Active.Map || Mapmaker.Active.Topic) && Mapmaker.Famous && Mapmaker.Famous.maps.surf) Mapmaker.Famous.maps.reposition();
        });

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
			$(document).on(Mapmaker.JuntoView.events.turnOn, function(event) {
				
			});
			$(document).on(Mapmaker.JuntoView.events.turnOff, function(event) {
				
			});

			// for FilterView
			$(document).on(Mapmaker.FilterView.events.change, function(event) {
				
			});

			// for NewTopicView
			$(document).on(Mapmaker.NewTopicView.events.create, function(event, data) {
				
			});

			// for NewSynapseView
			$(document).on(Mapmaker.NewSynapseView.events.create, function(event, data) {
				
			});	

			// for TopicMappingView
			$(document).on(Mapmaker.TopicMappingView.events.mousedown, function(event) {
				Handlers.topicMousedown.call(self);
			});
			$(document).on(Mapmaker.TopicMappingView.events.mouseup, function(event, topicMappingView) {
				Handlers.topicMouseup.call(self, topicMappingView);
			});
			$(document).on(Mapmaker.TopicMappingView.events.doubleClick, function(event, topicMappingView) {
				Handlers.topicDoubleClick.call(self, topicMappingView);
			});
			$(document).on(Mapmaker.TopicMappingView.events.dragEnd, function(event) {
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

      Engine.on('prerender', function() {
        Object.keys(self.synapses).forEach(function(key) {
          self.synapses[key].updateDisplay();
        });
      });
		},
		getMetacodes: function(path) {
			var self = this;

			var start = function(data) {
				self.metacodes = new Mapmaker.MetacodeCollection(data);

        var
          set = new Mapmaker.MetacodeCollection(data.slice(0, 20));
        self.newTopic.initializeCarousel(set);
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
		canvasDoubleClick: function(event) {

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
				this.topicCards[topic.id] = new Mapmaker.TopicCardView({
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
	 * @class Mapmaker.MapView
	 * @param {Mapmaker.Map} map The map to create a view for
	 * @param {Object} config Configuration options, must be at least an empty
	 * object {@link Mapmaker.MapView#defaultConfig}
	 * @param {jQuery} $parent Jquery object pointing to the 'parent' element
	 * in the dom, and UI DOM elements created will be rooted here.
	 */
	var mapView = function(map, config, $parent) {
		var self = this;

		/**
		 * representation of the parent DOM element
		 * @property {jQuery}
		 */
		this.$parent = $parent;
		this.parseConfig(config);
		/**
		 * The current map
		 * @property {Mapmaker.Map}
		 */
		this.currentMap = map;

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
    /**
     * The current map
     * @property {Mapmaker.Mapper}
     */
    this.currentMapper = new Mapmaker.Mapper({
      id: Math.floor(Math.random() * 20),
      name: makeid(),
      permission: 'commons',
      image: 'http://www.fitness-training-at-home.com/image-files/zflowericon.gif'
    });

		/**
		 * The collection of metacodes to use
		 * @property {Mapmaker.MetacodeCollection}
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

		this.Touch = {
		    touchPos: null, // this stores the x and y values of a current touch event 
		    touchDragNode: null // this stores a reference to a JIT node that is being dragged
		};

		this.Mouse = {
		    didPan: false,
		    didBoxZoom: false,
		    changeInX: 0,
		    changeInY: 0,
		    edgeHoveringOver: false,
		    boxStartCoordinates: false,
		    boxEndCoordinates: false,
		    synapseStartCoordinates: [],
		    synapseEndCoordinates: null,
		    lastNodeClick: 0,
		    lastCanvasClick: 0,
		    DOUBLE_CLICK_TOLERANCE: 300
		};

		this.Selected = {
		    reset: function () {
		        self.Selected.Nodes = [];
		        self.Selected.Edges = [];
		    },
		    Nodes: [],
		    Edges: []
		};

    Private.createGraphContainer.call(this);
		Private.createViews.call(this);
		Private.addModules.call(this);
		Private.getMetacodes.call(this, this.config.paths.metacodes);
		Private.subscribeEvents.call(this);
	};

	/**
	 * Parses and sets current configuration
	 * @param {Object} config The configration object, defaults will be applied.
	 * See {@link Mapmaker.MapView#defaultConfig}
	 */
	mapView.prototype.parseConfig = function(config) {
		Mapmaker.Utility.extendIf(config, defaultConfig);
		this.config = config;
	};


	mapView.prototype.addTopicMappingView = function(mapping) {
		var view = new Mapmaker.TopicMappingView(this, mapping);
		this.topics[mapping.cid] = view;
	};

	mapView.prototype.removeTopicMappingView = function(mapping) {
		this.topics[mapping.cid].remove();
		delete this.topics[mapping.cid];
	};

	mapView.prototype.addSynapseMappingView = function(mapping) {
		var view = new Mapmaker.SynapseMappingView(this, mapping);
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
Mapmaker.MapView.events = {
	mappingSelected: "Mapmaker:MapView:mappingSelected"
};
