if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Visualize = (function ($) {

    var vis = function (mapView) {
        this.mapView = mapView;

        this.mGraph = null; // a reference to the graph object.
        this.cameraPosition = null; // stores the camera position when using a 3D visualization
        this.type = "ForceDirected"; // the type of graph we're building, could be "RGraph", "ForceDirected", or "ForceDirected3D"
        this.loadLater = false; // indicates whether there is JSON that should be loaded right in the offset, or whether to wait till the first topic is created
    }
    
    vis.prototype.init = function () {
        var self = this;
        // disable awkward dragging of the canvas element that would sometimes happen
        $('#infovis-canvas').on('dragstart', function (event) {
            event.preventDefault();
        });

        // prevent touch events on the canvas from default behaviour
        $("#infovis-canvas").bind('touchstart', function (event) {
            event.preventDefault();
            self.mGraph.events.touched = true;
        });

        // prevent touch events on the canvas from default behaviour
        $("#infovis-canvas").bind('touchmove', function (event) {
            //this.mapView.JIT.touchPanZoomHandler(event);
        });

        // prevent touch events on the canvas from default behaviour
        $("#infovis-canvas").bind('touchend touchcancel', function (event) {
            lastDist = 0;
            if (!self.mGraph.events.touchMoved && !self.mapView.Touch.touchDragNode) self.mapView.TopicCard.hideCurrentCard();
            self.mGraph.events.touched = self.mGraph.events.touchMoved = false;
            self.mapView.Touch.touchDragNode = false;
        });
    }

    vis.prototype.computePositions = function () {
        var self = this,
            mapping;

        if (self.type == "RGraph") {
            var i, l, startPos, endPos, topic, synapse;

            self.mGraph.graph.eachNode(function (n) {
                topic = self.mapView.Topics.get(n.id);
                topic.set({ node: n }, { silent: true });
                topic.updateNode();

                n.eachAdjacency(function (edge) {
                    if(!edge.getData('init')) {
                        edge.setData('init', true);

                        l = edge.getData('synapseIDs').length;
                        for (i = 0; i < l; i++) {
                            synapse = self.mapView.Synapses.get(edge.getData('synapseIDs')[i]);
                            synapse.set({ edge: edge }, { silent: true });
                            synapse.updateEdge();
                        }
                    }
                });
                
                var pos = n.getPos();
                pos.setc(-200, -200);
            });
            self.mGraph.compute('end');
        } else if (self.type == "ForceDirected") {
            var i, l, startPos, endPos, topic, synapse;

            self.mGraph.graph.eachNode(function (n) {
                topic = self.mapView.Topics.get(n.id);
                topic.set({ node: n }, { silent: true });
                topic.updateNode();
                mapping = topic.getMapping();

                n.eachAdjacency(function (edge) {
                    if(!edge.getData('init')) {
                        edge.setData('init', true);

                        l = edge.getData('synapseIDs').length;
                        for (i = 0; i < l; i++) {
                            synapse = self.mapView.Synapses.get(edge.getData('synapseIDs')[i]);
                            synapse.set({ edge: edge }, { silent: true });
                            synapse.updateEdge();
                        }
                    }
                });

                startPos = new $jit.Complex(0, 0);
                endPos = new $jit.Complex(mapping.get('xloc'), mapping.get('yloc'));
                n.setPos(startPos, 'start');
                n.setPos(endPos, 'end');
            });
        } else if (self.type == "ForceDirected3D") {
            self.mGraph.compute();
        }
    }

    /**
     * render does the heavy lifting of creating the engine that renders the graph with the properties we desire
     *
     */
    vis.prototype.render = function () {
        var self = this, RGraphSettings, FDSettings;

        if (self.type == "RGraph" && (!self.mGraph || self.mGraph instanceof $jit.ForceDirected)) {

            RGraphSettings = $.extend(true, {}, this.mapView.JIT.ForceDirected.graphSettings);

            $jit.RGraph.Plot.NodeTypes.implement(this.mapView.JIT.ForceDirected.nodeSettings);
            $jit.RGraph.Plot.EdgeTypes.implement(this.mapView.JIT.ForceDirected.edgeSettings);
            
            RGraphSettings.width = $(document).width();
            RGraphSettings.height = $(document).height();
            RGraphSettings.background = this.mapView.JIT.RGraph.background;
            RGraphSettings.levelDistance = this.mapView.JIT.RGraph.levelDistance;
            
            self.mGraph = new $jit.RGraph(RGraphSettings);

        } else if (self.type == "ForceDirected" && (!self.mGraph || self.mGraph instanceof $jit.RGraph)) {

            FDSettings = $.extend(true, {}, this.mapView.JIT.ForceDirected.graphSettings);

            $jit.ForceDirected.Plot.NodeTypes.implement(this.mapView.JIT.ForceDirected.nodeSettings);
            $jit.ForceDirected.Plot.EdgeTypes.implement(this.mapView.JIT.ForceDirected.edgeSettings);
            
            FDSettings.width = $(document).width();
            FDSettings.height = $(document).height();

            self.mGraph = new $jit.ForceDirected(FDSettings);

        } else if (self.type == "ForceDirected3D" && !self.mGraph) {
            // init ForceDirected3D
            self.mGraph = new $jit.ForceDirected3D(this.mapView.JIT.ForceDirected3D.graphSettings);
            self.cameraPosition = self.mGraph.canvas.canvases[0].camera.position;
        }
        else {
            self.mGraph.graph.empty();
        }

        this.mapView.Loading.hide();
        // load JSON data, if it's not empty
        if (!self.loadLater) {
            //load JSON data.
            var rootIndex = 0;
            if (this.mapView.Active.Topic) {
                var node = _.find(this.mapView.JIT.vizData, function(node){
                    return node.id === this.mapView.Active.Topic.id;
                });
                rootIndex = _.indexOf(this.mapView.JIT.vizData, node);
            }
            self.mGraph.loadJSON(this.mapView.JIT.vizData, rootIndex);
            //compute positions and plot.
            self.computePositions();
            self.mGraph.busy = true;
            if (self.type == "RGraph") {
                self.mGraph.fx.animate(this.mapView.JIT.RGraph.animate);
            } else if (self.type == "ForceDirected") {
                self.mGraph.animate(this.mapView.JIT.ForceDirected.animateSavedLayout);
            } else if (self.type == "ForceDirected3D") {
                self.mGraph.animate(this.mapView.JIT.ForceDirected.animateFDLayout);
            }
        }

        // update the url now that the map is ready
        setTimeout(function(){
            var m = self.mapView.Active.Map;
            var t = self.mapView.Active.Topic;

            if (m && window.location.pathname !== "/maps/" + m.id) {
                self.mapView.Router.navigate("/maps/" + m.id);
            }
            else if (t && window.location.pathname !== "/topics/" + t.id) {
                self.mapView.Router.navigate("/topics/" + t.id);
            }
        }, 800);

    }

    return vis;

}(jQuery));
