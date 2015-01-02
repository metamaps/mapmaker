Metamaps.Synapse = Backbone.Model.extend({
    urlRoot: '/synapses',
    blacklist: ['edge', 'created_at', 'updated_at'],
    toJSON: function (options) {
        return _.omit(this.attributes, this.blacklist);
    },
    save: function (key, val, options) {
        
        var attrs;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (key === null || typeof key === 'object') {
            attrs = key;
            options = val;
        } else {
            (attrs = {})[key] = val;
        }

        var newOptions = options || {};
        var s = newOptions.success;

        var permBefore = this.get('permission');

        newOptions.success = function (model, response, opt) {
            if (s) s(model, response, opt);
            model.trigger('saved');

            if (permBefore === 'private' && model.get('permission') !== 'private') {
                model.trigger('noLongerPrivate');
            }
            else if (permBefore !== 'private' && model.get('permission') === 'private') {
                model.trigger('nowPrivate');
            }
        };
        return Backbone.Model.prototype.save.call(this, attrs, newOptions);
    },
    initialize: function () {
        if (this.isNew()) {
            this.set({
                "user_id": Metamaps.Active.Mapper.id,
                "permission": Metamaps.Active.Map ? Metamaps.Active.Map.get('permission') : 'commons',
                "category": "from-to"
            });
        }

        this.on('changeByOther', this.updateCardView);
        this.on('change', this.updateEdgeView);
        this.on('saved', this.savedEvent);
        this.on('noLongerPrivate', function(){
            var newSynapseData = {
                mappingid: this.getMapping().id,
                synapseid: this.id
            };

            $(document).trigger(Metamaps.JIT.events.newSynapse, [newSynapseData]);
        });
        this.on('nowPrivate', function(){
            $(document).trigger(Metamaps.JIT.events.removeSynapse, [{
                synapseid: this.id
            }]);
        });

        //this.on('change:desc', Metamaps.Filter.checkSynapses, this);
    },
    prepareLiForFilter: function () {
        var li = '';
        li += '<li data-id="' + this.get('desc') + '">';      
        li += '<img src="/assets/synapse16.png"';
        li += ' alt="synapse icon" />';      
        li += '<p>' + this.get('desc') + '</p></li>';
        return li;
    },
    authorizeToEdit: function (mapper) {
        if (mapper && (this.get('permission') === "commons" || this.get('user_id') === mapper.get('id'))) return true;
        else return false;
    },
    authorizePermissionChange: function (mapper) {
        if (mapper && this.get('user_id') === mapper.get('id')) return true;
        else return false;
    },
    getTopicMapping1: function () {
        var topic_id = this.get("node1_id");

        //hack: 'map' is currently a global
        var mappingCollection = map.get("topicMappings");

        return mappingCollection.findWhere({topic_id: topic_id});
    },
    getTopicMapping2: function () {
        var topic_id = this.get("node2_id");

        //hack: 'map' is currently a global
        var mappingCollection = map.get("topicMappings");

        return mappingCollection.findWhere({topic_id: topic_id});
    },
    getTopic1: function () {
        var topic_id = this.get("node1_id");

        //hack: 'map' is currently a global
        var topicCollection = map.get("topics");

        return topicCollection.get(topic_id);
    },
    getTopic2: function () {
        var topic_id = this.get("node2_id");

        //hack: 'map' is currently a global
        var topicCollection = map.get("topics");

        return topicCollection.get(topic_id);
    },
    getDirection: function () {
        return [
                this.getTopic1().get('node').id,
                this.getTopic2().get('node').id
            ];
    },
    getMapping: function () {
        
        if (!Metamaps.Active.Map) return false;
        
        return Metamaps.Mappings.findWhere({
            map_id: Metamaps.Active.Map.id,
            synapse_id: this.isNew() ? this.cid : this.id
        });
    },
    createEdge: function () {
        var mapping, mappingID;
        var synapseID = this.isNew() ? this.cid : this.id;

        var edge = {
            nodeFrom: this.get('node1_id'),
            nodeTo: this.get('node2_id'),
            data: {
                $synapses: [],
                $synapseIDs: [synapseID],
            }
        };
        
        if (Metamaps.Active.Map) {
            mapping = this.getMapping();
            mappingID = mapping.isNew() ? mapping.cid : mapping.id;
            edge.data.$mappings = [];
            edge.data.$mappingIDs = [mappingID];
        }
        
        return edge;
    },
    updateEdge: function () {
        var mapping;
        var edge = this.get('edge');
        edge.getData('synapses').push(this);
        
        if (Metamaps.Active.Map) {
            mapping = this.getMapping();
            edge.getData('mappings').push(mapping);
        }
        
        return edge;
    },
    savedEvent: function() {
        Metamaps.Realtime.sendSynapseChange(this);
    },
    updateViews: function() {
        this.updateCardView();
        this.updateEdgeView();
    },
    updateCardView: function() {
        var onPageWithSynapseCard = Metamaps.Active.Map || Metamaps.Active.Topic;
        var edge = this.get('edge');

        // update synapse card, if this synapse is the one open there
        if (onPageWithSynapseCard && edge == Metamaps.SynapseCard.openSynapseCard) {
            Metamaps.SynapseCard.showCard(edge);
        }
    },
    updateEdgeView: function() {
        var onPageWithSynapseCard = Metamaps.Active.Map || Metamaps.Active.Topic;
        var edge = this.get('edge');

        // update the edge on the map
        if (onPageWithSynapseCard && edge) {
            Metamaps.Visualize.mGraph.plot();
        }
    }
});