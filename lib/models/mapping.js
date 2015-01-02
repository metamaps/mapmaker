Metamaps.Mapping = Backbone.Model.extend({
    urlRoot: "/mappings",
    blacklist: ["created_at", "updated_at", "map", "topic"],
    toJSON: function (options) {
        return _.omit(this.attributes, this.blacklist);
    },
    initialize: function () {
        
    },
    getMap: function () {
        return Metamaps.Map.get(this.get("map_id"));
    },
    getTopic: function () {
        var topic_id = this.get("topic_id");

        //hack: 'map' is currently a global
        var topicCollection = map.get("topics");

        return topicCollection.get(topic_id);
    },
    getSynapse: function () {
        if (this.get("category") === "Synapse") return Metamaps.Synapse.get(this.get("synapse_id"));
        else return false;
    }
});