Metamaps.Topic = Backbone.Model.extend({
    urlRoot: '/topics',
    blacklist: ['node', 'created_at', 'updated_at', 'user_name', 'user_image', 'map_count', 'synapse_count'],
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
                "desc": '',
                "link": '',
                "permission": Metamaps.Active.Map ? Metamaps.Active.Map.get('permission') : 'commons'
            });
        }
        
        this.on('changeByOther', this.updateCardView);
        this.on('change', this.updateNodeView);
        this.on('saved', this.savedEvent);
        this.on('nowPrivate', function(){
            var removeTopicData = {
                topicid: this.id
            };

            $(document).trigger(Metamaps.JIT.events.removeTopic, [removeTopicData]);
        });
        this.on('noLongerPrivate', function(){
            var newTopicData = {
                mappingid: this.getMapping().id,
                topicid: this.id
            };

            $(document).trigger(Metamaps.JIT.events.newTopic, [newTopicData]);
        });

        //this.on('change:metacode_id', Metamaps.Filter.checkMetacodes, this);

    },
    authorizeToEdit: function (mapper) {
        if (mapper && (this.get('permission') === "commons" || this.get('user_id') === mapper.get('id'))) return true;
        else return false;
    },
    authorizePermissionChange: function (mapper) {
        if (mapper && this.get('user_id') === mapper.get('id')) return true;
        else return false;
    },
    getDate: function () {

    },
    getMetacode: function () {
        return Metamaps.Metacodes.get(this.get('metacode_id'));
    },
    getMapping: function () {
        
        if (!Metamaps.Active.Map) return false;
        
        return Metamaps.Mappings.findWhere({
            map_id: Metamaps.Active.Map.id,
            topic_id: this.isNew() ? this.cid : this.id
        });
    },
    createNode: function () {
        var mapping;
        var node = {
            adjacencies: [],
            id: this.isNew() ? this.cid : this.id,
            name: this.get('name')
        };
        
        if (Metamaps.Active.Map) {
            mapping = this.getMapping();
            node.data = {
                $mapping: null,
                $mappingID: mapping.id
            };
        }
        
        return node;
    },
    updateNode: function () {
        var mapping;
        var node = this.get('node');
        node.setData('topic', this);
        
        if (Metamaps.Active.Map) {
            mapping = this.getMapping();
            node.setData('mapping', mapping);
        }
        
        return node;
    },
    savedEvent: function() {
        Metamaps.Realtime.sendTopicChange(this);
    },
    updateViews: function() {
        var onPageWithTopicCard = Metamaps.Active.Map || Metamaps.Active.Topic;
        var node = this.get('node');
        // update topic card, if this topic is the one open there
        if (onPageWithTopicCard && this == Metamaps.TopicCard.openTopicCard) {
            Metamaps.TopicCard.showCard(node);
        }

        // update the node on the map
        if (onPageWithTopicCard && node) {
            node.name = this.get('name'); 
            Metamaps.Visualize.mGraph.plot();
        }
    },
    updateCardView: function() {
        var onPageWithTopicCard = Metamaps.Active.Map || Metamaps.Active.Topic;
        var node = this.get('node');
        // update topic card, if this topic is the one open there
        if (onPageWithTopicCard && this == Metamaps.TopicCard.openTopicCard) {
            Metamaps.TopicCard.showCard(node);
        }
    },
    updateNodeView: function() {
        var onPageWithTopicCard = Metamaps.Active.Map || Metamaps.Active.Topic;
        var node = this.get('node');

        // update the node on the map
        if (onPageWithTopicCard && node) {
            node.name = this.get('name'); 
            Metamaps.Visualize.mGraph.plot();
        }
    }
});