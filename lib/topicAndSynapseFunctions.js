
// SYNAPSES

    renderSynapse: function (mapping, synapse, node1, node2, createNewInDB) {
        var self = Mapmaker.Synapse;

        var edgeOnViz;

        var newedge = synapse.createEdge();

        Mapmaker.Visualize.mGraph.graph.addAdjacence(node1, node2, newedge.data);
        edgeOnViz = Mapmaker.Visualize.mGraph.graph.getAdjacence(node1.id, node2.id);
        synapse.set('edge', edgeOnViz);
        synapse.updateEdge(); // links the synapse and the mapping to the edge

        Mapmaker.Control.selectEdge(edgeOnViz);

        var mappingSuccessCallback = function (mappingModel, response) {
            var newSynapseData = {
                mappingid: mappingModel.id,
                synapseid: mappingModel.get('synapse_id')
            };

            $(document).trigger(Mapmaker.JIT.events.newSynapse, [newSynapseData]);
        };
        var synapseSuccessCallback = function (synapseModel, response) {
            if (Mapmaker.Active.Map) {
                mapping.save({ synapse_id: synapseModel.id }, {
                    success: mappingSuccessCallback
                });
            }
        };

        if (!Mapmaker.Settings.sandbox && createNewInDB) {
            if (synapse.isNew()) {
                synapse.save(null, {
                    success: synapseSuccessCallback,
                    error: function (model, response) {
                        console.log('error saving synapse to database');
                    }
                });
            } else if (!synapse.isNew() && Mapmaker.Active.Map) {
                mapping.save(null, {
                    success: mappingSuccessCallback
                });
            }
        }
    },
    createSynapseLocally: function () {
        var self = Mapmaker.Synapse,
            topic1,
            topic2,
            node1,
            node2,
            synapse,
            mapping;

        $(document).trigger(Mapmaker.Map.events.editedByActiveMapper);

        //for each node in this array we will create a synapse going to the position2 node.
        var synapsesToCreate = [];

        topic2 = Mapmaker.Topics.get(Mapmaker.Create.newSynapse.topic2id);
        node2 = topic2.get('node');

        var len = Mapmaker.Selected.Nodes.length;
        if (len == 0) {
            topic1 = Mapmaker.Topics.get(Mapmaker.Create.newSynapse.topic1id);
            synapsesToCreate[0] = topic1.get('node');
        } else if (len > 0) {
            synapsesToCreate = Mapmaker.Selected.Nodes;
        }

        for (var i = 0; i < synapsesToCreate.length; i++) {
            node1 = synapsesToCreate[i];
            topic1 = node1.getData('topic');
            synapse = new Mapmaker.Backbone.Synapse({
                desc: Mapmaker.Create.newSynapse.description,
                node1_id: topic1.isNew() ? topic1.cid : topic1.id,
                node2_id: topic2.isNew() ? topic2.cid : topic2.id,
            });
            Mapmaker.Synapses.add(synapse);

            mapping = new Mapmaker.Backbone.Mapping({
                category: "Synapse",
                synapse_id: synapse.cid
            });
            Mapmaker.Mappings.add(mapping);

            // this function also includes the creation of the synapse in the database
            self.renderSynapse(mapping, synapse, node1, node2, true);
        } // for each in synapsesToCreate

        Mapmaker.Create.newSynapse.hide();
    },
    getSynapseFromAutocomplete: function (id) {
        var self = Mapmaker.Synapse,
            topic1,
            topic2,
            node1,
            node2;

        var synapse = self.get(id);

        var mapping = new Mapmaker.Backbone.Mapping({
            category: "Synapse",
            synapse_id: synapse.id
        });
        Mapmaker.Mappings.add(mapping);

        topic1 = Mapmaker.Topics.get(Mapmaker.Create.newSynapse.topic1id);
        node1 = topic1.get('node');
        topic2 = Mapmaker.Topics.get(Mapmaker.Create.newSynapse.topic2id);
        node2 = topic2.get('node');
        Mapmaker.Create.newSynapse.hide();

        self.renderSynapse(mapping, synapse, node1, node2, true);
    }






// TOPICs



    launch: function (id) {
        var bb = Mapmaker.Backbone;
        var start = function (data) {
            Mapmaker.Active.Topic = new bb.Topic(data.topic);
            Mapmaker.Creators = new bb.MapperCollection(data.creators);
            Mapmaker.Topics = new bb.TopicCollection([data.topic].concat(data.relatives));
            Mapmaker.Synapses = new bb.SynapseCollection(data.synapses);
            Mapmaker.Backbone.attachCollectionEvents();

            // set filter mapper H3 text
            $('#filter_by_mapper h3').html('CREATORS');

            // build and render the visualization
            Mapmaker.Visualize.type = "RGraph";
            Mapmaker.JIT.prepareVizData();

            // update filters
            Mapmaker.Filter.reset(); 

            // reset selected arrays
            Mapmaker.Selected.reset();

            // these three update the actual filter box with the right list items
            Mapmaker.Filter.checkMetacodes();
            Mapmaker.Filter.checkSynapses();
            Mapmaker.Filter.checkMappers();
        }

        $.ajax({
            url: "/topics/" + id + "/network.json",
            success: start
        });
    },
    end: function () {
        if (Mapmaker.Active.Topic) {
            $('.rightclickmenu').remove();
            Mapmaker.TopicCard.hideCard();
            Mapmaker.SynapseCard.hideCard();
            Mapmaker.Filter.close();
        }
    },

    centerOn: function (nodeid) {
        if (!Mapmaker.Visualize.mGraph.busy) {
            Mapmaker.Visualize.mGraph.onClick(nodeid, {
                hideLabels: false,
                duration: 1000,
                onComplete: function () {
                    
                }
            });
        }
    },
    fetchRelatives: function(node, metacode_id) {
        
        var topics = Mapmaker.Topics.map(function(t){ return t.id });
        var topics_string = topics.join();

        var creators = Mapmaker.Creators.map(function(t){ return t.id });
        var creators_string = creators.join();

        var topic = node.getData('topic');

        var successCallback = function(data) {
            if (data.creators.length > 0) Mapmaker.Creators.add(data.creators);
            if (data.topics.length > 0) Mapmaker.Topics.add(data.topics);
            if (data.synapses.length > 0) Mapmaker.Synapses.add(data.synapses);

            var topicColl = new Mapmaker.Backbone.TopicCollection(data.topics);
            topicColl.add(topic);
            var synapseColl = new Mapmaker.Backbone.SynapseCollection(data.synapses);

            var graph = Mapmaker.JIT.convertModelsToJIT(topicColl, synapseColl)[0];
            Mapmaker.Visualize.mGraph.op.sum(graph, {
                type: 'fade',
                duration: 500,
                hideLabels: false
            });

            var i, l, t, s;
        
            Mapmaker.Visualize.mGraph.graph.eachNode(function (n) {
                t = Mapmaker.Topics.get(n.id);
                t.set({ node: n }, { silent: true });
                t.updateNode();

                n.eachAdjacency(function (edge) {
                    if(!edge.getData('init')) {
                        edge.setData('init', true);

                        l = edge.getData('synapseIDs').length;
                        for (i = 0; i < l; i++) {
                            s = Mapmaker.Synapses.get(edge.getData('synapseIDs')[i]);
                            s.set({ edge: edge }, { silent: true });
                            s.updateEdge();
                        }
                    }
                });
            });
        };

        var paramsString = metacode_id ? "metacode=" + metacode_id + "&" : "";
        paramsString += "network=" + topics_string + "&creators=" + creators_string;

        $.ajax({
            type: "Get",
            url: "/topics/" + topic.id + "/relatives.json?" + paramsString,
            success: successCallback,
            error: function () {
                
            }
        });
    },
    /*
     *
     *
     */
    renderTopic: function (mapping, topic, createNewInDB, permitCreateSynapseAfter) {
        var self = Mapmaker.Topic;

        var nodeOnViz, tempPos;

        var newnode = topic.createNode();

        var midpoint = {}, pixelPos;

        if (!$.isEmptyObject(Mapmaker.Visualize.mGraph.graph.nodes)) {
            Mapmaker.Visualize.mGraph.graph.addNode(newnode);
            nodeOnViz = Mapmaker.Visualize.mGraph.graph.getNode(newnode.id);
            topic.set('node', nodeOnViz, {silent: true});  
            topic.updateNode(); // links the topic and the mapping to the node 

            nodeOnViz.setData("dim", 1, "start");
            nodeOnViz.setData("dim", 25, "end");
            if (Mapmaker.Visualize.type === "RGraph") {
                tempPos = new $jit.Complex(mapping.get('xloc'), mapping.get('yloc'));
                tempPos = tempPos.toPolar();
                nodeOnViz.setPos(tempPos, "current");
                nodeOnViz.setPos(tempPos, "start");
                nodeOnViz.setPos(tempPos, "end");
            } else if (Mapmaker.Visualize.type === "ForceDirected") {
                nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "current");
                nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "start");
                nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "end");
            }
            if (Mapmaker.Create.newTopic.addSynapse && permitCreateSynapseAfter) {
                Mapmaker.Create.newSynapse.topic1id = tempNode.getData('topic').id;
                
                // position the form
                midpoint.x = tempNode.pos.getc().x + (nodeOnViz.pos.getc().x - tempNode.pos.getc().x) / 2;
                midpoint.y = tempNode.pos.getc().y + (nodeOnViz.pos.getc().y - tempNode.pos.getc().y) / 2;
                pixelPos = Mapmaker.Util.coordsToPixels(midpoint);
                $('#new_synapse').css('left', pixelPos.x + "px");
                $('#new_synapse').css('top', pixelPos.y + "px");
                // show the form
                Mapmaker.Create.newSynapse.open();
                Mapmaker.Visualize.mGraph.fx.animate({
                    modes: ["node-property:dim"],
                    duration: 500,
                    onComplete: function () {
                        tempNode = null;
                        tempNode2 = null;
                        tempInit = false;
                    }
                });
            } else {
                Mapmaker.Visualize.mGraph.fx.plotNode(nodeOnViz, Mapmaker.Visualize.mGraph.canvas);
                Mapmaker.Visualize.mGraph.fx.animate({
                    modes: ["node-property:dim"],
                    duration: 500,
                    onComplete: function () {

                    }
                });
            }
        } else {
            Mapmaker.Visualize.mGraph.loadJSON(newnode);
            nodeOnViz = Mapmaker.Visualize.mGraph.graph.getNode(newnode.id);
            topic.set('node', nodeOnViz, {silent: true});
            topic.updateNode(); // links the topic and the mapping to the node 

            nodeOnViz.setData("dim", 1, "start");
            nodeOnViz.setData("dim", 25, "end");
            nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "current");
            nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "start");
            nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), "end");
            Mapmaker.Visualize.mGraph.fx.plotNode(nodeOnViz, Mapmaker.Visualize.mGraph.canvas);
            Mapmaker.Visualize.mGraph.fx.animate({
                modes: ["node-property:dim"],
                duration: 500,
                onComplete: function () {

                }
            });
        }

        var mappingSuccessCallback = function (mappingModel, response) {
            var newTopicData = {
                mappingid: mappingModel.id,
                topicid: mappingModel.get('topic_id')
            };

            $(document).trigger(Mapmaker.JIT.events.newTopic, [newTopicData]);
        };  
        var topicSuccessCallback = function (topicModel, response) {
            if (Mapmaker.Active.Map) {
                mapping.save({ topic_id: topicModel.id }, {
                    success: mappingSuccessCallback,
                    error: function (model, response) {
                        console.log('error saving mapping to database');
                    }
                });
            }

            if (Mapmaker.Create.newTopic.addSynapse) {
                Mapmaker.Create.newSynapse.topic2id = topicModel.id;
            }
        };

        if (!Mapmaker.Settings.sandbox && createNewInDB) {
            if (topic.isNew()) {
                topic.save(null, {
                    success: topicSuccessCallback,
                    error: function (model, response) {
                        console.log('error saving topic to database');
                    }
                });
            } else if (!topic.isNew() && Mapmaker.Active.Map) {
                mapping.save(null, {
                    success: mappingSuccessCallback
                });
            }
        }
    },
    createTopicLocally: function () {
        var self = Mapmaker.Topic;

        if (Mapmaker.Create.newTopic.name === "") {
            Mapmaker.GlobalUI.notifyUser("Please enter a topic title...");
            return;
        }

        // hide the 'double-click to add a topic' message
        Mapmaker.Famous.viz.hideInstructions();

        $(document).trigger(Mapmaker.Map.events.editedByActiveMapper);

        var metacode = Mapmaker.Metacodes.get(Mapmaker.Create.newTopic.metacode);

        var topic = new Mapmaker.Backbone.Topic({
            name: Mapmaker.Create.newTopic.name,
            metacode_id: metacode.id
        });
        Mapmaker.Topics.add(topic);

        var mapping = new Mapmaker.Backbone.Mapping({
            category: "Topic",
            xloc: Mapmaker.Create.newTopic.x,
            yloc: Mapmaker.Create.newTopic.y,
            topic_id: topic.cid
        });
        Mapmaker.Mappings.add(mapping);

        //these can't happen until the value is retrieved, which happens in the line above
        Mapmaker.Create.newTopic.hide();

        self.renderTopic(mapping, topic, true, true); // this function also includes the creation of the topic in the database
    },
    getTopicFromAutocomplete: function (id) {
        var self = Mapmaker.Topic;

        $(document).trigger(Mapmaker.Map.events.editedByActiveMapper);

        Mapmaker.Create.newTopic.hide();

        var topic = self.get(id);

        var mapping = new Mapmaker.Backbone.Mapping({
            category: "Topic",
            xloc: Mapmaker.Create.newTopic.x,
            yloc: Mapmaker.Create.newTopic.y,
            topic_id: topic.id
        });
        Mapmaker.Mappings.add(mapping);

        self.renderTopic(mapping, topic, true, true);
    },
    getTopicFromSearch: function (event, id) {
        var self = Mapmaker.Topic;

        $(document).trigger(Mapmaker.Map.events.editedByActiveMapper);

        var topic = self.get(id);

        var nextCoords = Mapmaker.Map.getNextCoord();
        var mapping = new Mapmaker.Backbone.Mapping({
            category: "Topic",
            xloc: nextCoords.x,
            yloc: nextCoords.y,
            topic_id: topic.id
        });
        Mapmaker.Mappings.add(mapping);

        self.renderTopic(mapping, topic, true, true);

        Mapmaker.GlobalUI.notifyUser('Topic was added to your map!');

        event.stopPropagation();
        event.preventDefault();
        return false;
    }