Mapmaker.Mapping = (function() {

	return Backbone.Model.extend({
		urlRoot: "/mappings",
		blacklist: ["created_at", "updated_at", "map", "topic"],
		toJSON: function(options) {
			return _.omit(this.attributes, this.blacklist);
		},
		initialize: function() {

		},
		getMap: function() {
			return Mapmaker.Map.get(this.get("map_id"));
		},
		getTopic: function() {
			var topic_id = this.get("topic_id");

			//hack: 'map' is currently a global
			var topicCollection = map.get("topics");

			return topicCollection.get(topic_id);
		},
		getSynapse: function() {
			var synapse_id = this.get("synapse_id");

			//hack: 'map' is currently a global
			var synapseCollection = map.get("synapses");

			return synapseCollection.get(synapse_id);
		}
	}); // Backbone.Model.extend

}());
