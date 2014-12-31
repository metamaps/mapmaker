Metamaps.Mapping = Backbone.Model.extend({
    urlRoot: '/mappings',
    blacklist: ['created_at', 'updated_at'],
    toJSON: function (options) {
        return _.omit(this.attributes, this.blacklist);
    },
    initialize: function () {
        if (this.isNew()) {
            this.set({
                "user_id": Metamaps.Active.Mapper.id,
                "map_id": Metamaps.Active.Map ? Metamaps.Active.Map.id : null
            });
        }
    },
    getMap: function () {
        return Metamaps.Map.get(this.get('map_id'));
    },
    getTopic: function () {
        if (this.get('category') === 'Topic') return Metamaps.Topic.get(this.get('topic_id'));
        else return false;
    },
    getSynapse: function () {
        if (this.get('category') === 'Synapse') return Metamaps.Synapse.get(this.get('synapse_id'));
        else return false;
    }
});