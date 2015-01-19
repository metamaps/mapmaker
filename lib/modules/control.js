if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Control = (function ($) {

    var control = function (mapView) {
        this.mapView = mapView;
    }

    control.prototype.init = function () {

    }

    control.prototype.selectNode = function (node,e) {
        var filtered = node.getData('alpha') === 0;

        if (filtered || this.mapView.Selected.Nodes.indexOf(node) != -1) return;
        node.selected = true;
        node.setData('dim', 30, 'current');
        this.mapView.Selected.Nodes.push(node);
    }

    control.prototype.deselectAllNodes = function () {
        var l = this.mapView.Selected.Nodes.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            var node = this.mapView.Selected.Nodes[i];
            this.mapView.Control.deselectNode(node);
        }
        this.mapView.Visualize.mGraph.plot();
    }

    control.prototype.deselectNode = function (node) {
        delete node.selected;
        node.setData('dim', 25, 'current');

        //remove the node
        this.mapView.Selected.Nodes.splice(
        this.mapView.Selected.Nodes.indexOf(node), 1);
    }

    control.prototype.deleteSelected = function () {

        if (!this.mapView.Active.Map) return;
        
        var n = this.mapView.Selected.Nodes.length;
        var e = this.mapView.Selected.Edges.length;
        var ntext = n == 1 ? "1 topic" : n + " topics";
        var etext = e == 1 ? "1 synapse" : e + " synapses";
        var text = "You have " + ntext + " and " + etext + " selected. ";

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        var r = confirm(text + "Are you sure you want to permanently delete them all? This will remove them from all maps they appear on.");
        if (r == true) {
            this.mapView.Control.deleteSelectedEdges();
            this.mapView.Control.deleteSelectedNodes();
        }
    } 

    control.prototype.deleteSelectedNodes = function () { // refers to deleting topics permanently

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        var l = this.mapView.Selected.Nodes.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            var node = this.mapView.Selected.Nodes[i];
            this.mapView.Control.deleteNode(node.id);
        }
    } 

    control.prototype.deleteNode = function (nodeid) { // refers to deleting topics permanently
        
        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        var node = this.mapView.Visualize.mGraph.graph.getNode(nodeid);
        var topic = node.getData('topic');
        var topicid = topic.id;
        var mapping = node.getData('mapping');
        topic.destroy();
        this.mapView.Mappings.remove(mapping);
        $(document).trigger(this.mapView.JIT.events.deleteTopic, [{
            topicid: topicid
        }]);
        this.mapView.Control.hideNode(nodeid);
    } 

    control.prototype.removeSelectedNodes = function () { // refers to removing topics permanently from a map

        if (!this.mapView.Active.Map) return;

        var l = this.mapView.Selected.Nodes.length,
            i,
            node,
            authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        for (i = l - 1; i >= 0; i -= 1) {
            node = this.mapView.Selected.Nodes[i];
            this.mapView.Control.removeNode(node.id);
        }
    }

    control.prototype.removeNode = function (nodeid) { // refers to removing topics permanently from a map

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);
        var node = this.mapView.Visualize.mGraph.graph.getNode(nodeid);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        var topic = node.getData('topic');
        var topicid = topic.id;
        var mapping = node.getData('mapping');
        mapping.destroy();
        this.mapView.Topics.remove(topic);
        $(document).trigger(this.mapView.JIT.events.removeTopic, [{
            topicid: topicid
        }]);
        this.mapView.Control.hideNode(nodeid);
    }

    control.prototype.hideSelectedNodes = function () {
        var l = this.mapView.Selected.Nodes.length,
            i,
            node;

        for (i = l - 1; i >= 0; i -= 1) {
            node = this.mapView.Selected.Nodes[i];
            this.mapView.Control.hideNode(node.id);
        }
    }

    control.prototype.hideNode = function (nodeid) {
        var node = this.mapView.Visualize.mGraph.graph.getNode(nodeid);
        var graph = this.mapView.Visualize.mGraph;
        if (nodeid == this.mapView.Visualize.mGraph.root) { // && this.mapView.Visualize.type === "RGraph"
            var newroot = _.find(graph.graph.nodes, function(n){ return n.id !== nodeid; });
            graph.root = newroot ? newroot.id : null;
        }

        this.mapView.Control.deselectNode(node);

        node.setData('alpha', 0, 'end');
        node.eachAdjacency(function (adj) {
            adj.setData('alpha', 0, 'end');
        });
        this.mapView.Visualize.mGraph.fx.animate({
            modes: ['node-property:alpha',
            'edge-property:alpha'
        ],
            duration: 500
        });
        setTimeout(function () {
            this.mapView.Visualize.mGraph.graph.removeNode(nodeid);
        }, 500);
        this.mapView.Filter.checkMetacodes();
        this.mapView.Filter.checkMappers();
    }

    control.prototype.selectEdge = function (edge) {
        var filtered = edge.getData('alpha') === 0; // don't select if the edge is filtered

        if (filtered || this.mapView.Selected.Edges.indexOf(edge) != -1) return;

        var width = this.mapView.Mouse.edgeHoveringOver === edge ? 4 : 2;
        edge.setDataset('current', {
            showDesc: true,
            lineWidth: width,
            color: this.mapView.Settings.colors.synapses.selected
        });
        this.mapView.Visualize.mGraph.plot();

        this.mapView.Selected.Edges.push(edge);
    }

    control.prototype.deselectAllEdges = function () {
        var l = this.mapView.Selected.Edges.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            var edge = this.mapView.Selected.Edges[i];
            this.mapView.Control.deselectEdge(edge);
        }
        this.mapView.Visualize.mGraph.plot();
    }

    control.prototype.deselectEdge = function (edge) {
        edge.setData('showDesc', false, 'current');
        
        edge.setDataset('current', {
            lineWidth: 2,
            color: this.mapView.Settings.colors.synapses.normal
        });

        if (this.mapView.Mouse.edgeHoveringOver == edge) {
            edge.setDataset('current', {
                showDesc: true,
                lineWidth: 4
            });
        }

        this.mapView.Visualize.mGraph.plot();

        //remove the edge
        this.mapView.Selected.Edges.splice(
        this.mapView.Selected.Edges.indexOf(edge), 1);
    }

    control.prototype.deleteSelectedEdges = function () { // refers to deleting topics permanently
        var edge,
            l = this.mapView.Selected.Edges.length;

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        for (var i = l - 1; i >= 0; i -= 1) {
            edge = this.mapView.Selected.Edges[i];
            this.mapView.Control.deleteEdge(edge);
        }
    }

    control.prototype.deleteEdge = function (edge) {

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        if (edge.getData("synapses").length - 1 === 0) {
            this.mapView.Control.hideEdge(edge);
        }

        var index = edge.getData("displayIndex") ? edge.getData("displayIndex") : 0;

        var synapse = edge.getData("synapses")[index];
        var mapping = edge.getData("mappings")[index];
        var synapseid = synapse.id;
        synapse.destroy();

        // the server will destroy the mapping, we just need to remove it here
        this.mapView.Mappings.remove(mapping);
        edge.getData("mappings").splice(index, 1);
        edge.getData("synapses").splice(index, 1);
        if (edge.getData("displayIndex")) {
            delete edge.data.$displayIndex;
        }
        $(document).trigger(this.mapView.JIT.events.deleteSynapse, [{
            synapseid: synapseid
        }]);
    }

    control.prototype.removeSelectedEdges = function () {
        var l = this.mapView.Selected.Edges.length,
            i,
            edge;

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        for (i = l - 1; i >= 0; i -= 1) {
            edge = this.mapView.Selected.Edges[i];
            this.mapView.Control.removeEdge(edge);
        }
        this.mapView.Selected.Edges = new Array();
    }

    control.prototype.removeEdge = function (edge) {

        if (!this.mapView.Active.Map) return;

        var authorized = this.mapView.Active.Map.authorizeToEdit(this.mapView.Active.Mapper);

        if (!authorized) {
            this.mapView.GlobalUI.notifyUser("Cannot edit Public map.");
            return;
        }

        if (edge.getData("mappings").length - 1 === 0) {
            this.mapView.Control.hideEdge(edge);
        }

        var index = edge.getData("displayIndex") ? edge.getData("displayIndex") : 0;

        var synapse = edge.getData("synapses")[index];
        var mapping = edge.getData("mappings")[index];
        var synapseid = synapse.id;
        mapping.destroy();

        this.mapView.Synapses.remove(synapse);

        edge.getData("mappings").splice(index, 1);
        edge.getData("synapses").splice(index, 1);
        if (edge.getData("displayIndex")) {
            delete edge.data.$displayIndex;
        }
        $(document).trigger(this.mapView.JIT.events.removeSynapse, [{
            synapseid: synapseid
        }]);
    }

    control.prototype.hideSelectedEdges = function () {
        var edge,
            l = this.mapView.Selected.Edges.length,
            i;
        for (i = l - 1; i >= 0; i -= 1) {
            edge = this.mapView.Selected.Edges[i];
            this.mapView.Control.hideEdge(edge);
        }
        this.mapView.Selected.Edges = new Array();
    }

    control.prototype.hideEdge = function (edge) {
        var from = edge.nodeFrom.id;
        var to = edge.nodeTo.id;
        edge.setData('alpha', 0, 'end');
        this.mapView.Control.deselectEdge(edge);
        this.mapView.Visualize.mGraph.fx.animate({
            modes: ['edge-property:alpha'],
            duration: 500
        });
        setTimeout(function () {
            this.mapView.Visualize.mGraph.graph.removeAdjacence(from, to);
        }, 500);
        this.mapView.Filter.checkSynapses();
        this.mapView.Filter.checkMappers();
    }

    control.prototype.updateSelectedPermissions = function (permission) {

        var edge, synapse, node, topic;

        this.mapView.GlobalUI.notifyUser('Working...');

        // variables to keep track of how many nodes and synapses you had the ability to change the permission of
        var nCount = 0,
            sCount = 0;

        // change the permission of the selected synapses, if logged in user is the original creator
        var l = this.mapView.Selected.Edges.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            edge = this.mapView.Selected.Edges[i];
            synapse = edge.getData('synapses')[0];

            if (synapse.authorizePermissionChange(this.mapView.Active.Mapper)) {
                synapse.save({
                    permission: permission
                });
                sCount++;
            }
        }

        // change the permission of the selected topics, if logged in user is the original creator
        var l = this.mapView.Selected.Nodes.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            node = this.mapView.Selected.Nodes[i];
            topic = node.getData('topic');

            if (topic.authorizePermissionChange(this.mapView.Active.Mapper)) {
                topic.save({
                    permission: permission
                });
                nCount++;
            }
        }

        var nString = nCount == 1 ? (nCount.toString() + ' topic and ') : (nCount.toString() + ' topics and ');
        var sString = sCount == 1 ? (sCount.toString() + ' synapse') : (sCount.toString() + ' synapses');

        var message = nString + sString + ' you created updated to ' + permission;
        this.mapView.GlobalUI.notifyUser(message);
    }

    control.prototype.updateSelectedMetacodes = function (metacode_id) {

        var node, topic;

        this.mapView.GlobalUI.notifyUser('Working...');

        var metacode = this.mapView.Metacodes.get(metacode_id);

        // variables to keep track of how many nodes and synapses you had the ability to change the permission of
        var nCount = 0;

        // change the permission of the selected topics, if logged in user is the original creator
        var l = this.mapView.Selected.Nodes.length;
        for (var i = l - 1; i >= 0; i -= 1) {
            node = this.mapView.Selected.Nodes[i];
            topic = node.getData('topic');

            if (topic.authorizeToEdit(this.mapView.Active.Mapper)) {
                topic.save({
                    'metacode_id': metacode_id
                });
                nCount++;
            }
        }

        var nString = nCount == 1 ? (nCount.toString() + ' topic') : (nCount.toString() + ' topics');

        var message = nString + ' you can edit updated to ' + metacode.get('name');
        this.mapView.GlobalUI.notifyUser(message);
        this.mapView.Visualize.mGraph.plot();
    }

    return control; 

}(jQuery));
