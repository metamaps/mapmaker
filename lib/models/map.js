Metamaps.Map = (function() {

	return Backbone.Model.extend({
		urlRoot: "/maps",
		blacklist: ["created_at", "updated_at", "user_name", "contributor_count", "topic_count",
			"synapse_count", "topics", "synapses", "mappings", "mappers"],
		toJSON: function(options) {
			return _.omit(this.attributes, this.blacklist);
		},
		save: function(key, val, options) {

			var attrs;

			// Handle both `"key", value` and `{key: value}` -style arguments.
			if (key == null || typeof key === "object") {
				attrs = key;
				options = val;
			} else {
				(attrs = {})[key] = val;
			}

			var newOptions = options || {};
			var s = newOptions.success;

			newOptions.success = function(model, response, opt) {
				if (s) s(model, response, opt);
				model.trigger("saved");
			};
			return Backbone.Model.prototype.save.call(this, attrs, newOptions);
		},
		initialize: function() {
			//this.on("changeByOther", this.updateView);
			this.on("saved", this.savedEvent);

			/*
        this.set("topics", new Metamaps.TopicCollection([
            {
                id: 1,
                name: "collaboration",
                metacode_id: 1234
            },
            {
                id: 2,
                name: "interpretation",
                metacode_id: 1234
            }
        ]));

        this.set("synapses", new Metamaps.SynapseCollection());
        
        this.set("topicMappings", new Metamaps.MappingCollection([
            {
                id: 1,
                topic_id: 1,
                category: "topic",
                xloc: XLOC,
                yloc: YLOC
            },
            {
                id: 2,
                topic_id: 2,
                category: "topic",
                xloc: XLOC2,
                yloc: YLOC2
            }
        ]));

        this.set("synapseMappings", new Metamaps.MappingCollection());

        */
		},
		savedEvent: function() {
			//Metamaps.Realtime.sendMapChange(this);
		},
		authorizeToEdit: function(mapper) {
			if (mapper && (this.get("permission") === "commons" || this.get("user_id") === mapper.get(
				"id"))) return true;
			else return false;
		},
		authorizePermissionChange: function(mapper) {
			if (mapper && this.get("user_id") === mapper.get("id")) return true;
			else return false;
		}
	}); // Backbone.Model.extend

}());
/**
 * @class
 * @static
 */
Metamaps.Map.events = {
	/**
	 * @event
	 */
	mapChanged: "Metamaps:Map:mapChanged"
};
