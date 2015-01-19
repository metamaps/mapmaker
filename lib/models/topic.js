Mapmaker.Topic = (function() {

	return Backbone.Model.extend({
		urlRoot: "/topics",
		blacklist: ["node", "created_at", "updated_at", "user_name", "user_image", "map_count",
			"synapse_count"],
		toJSON: function(options) {
			return _.omit(this.attributes, this.blacklist);
		},
		save: function(key, val, options) {

			var attrs;

			// Handle both `"key", value` and `{key: value}` -style arguments.
			if (key === null || typeof key === "object") {
				attrs = key;
				options = val;
			} else {
				(attrs = {})[key] = val;
			}

			var newOptions = options || {};
			var s = newOptions.success;

			var permBefore = this.get("permission");

			newOptions.success = function(model, response, opt) {
				if (s) s(model, response, opt);
				model.trigger("saved");

				if (permBefore === "private" && model.get("permission") !== "private") {
					model.trigger("noLongerPrivate");
				} else if (permBefore !== "private" && model.get("permission") === "private") {
					model.trigger("nowPrivate");
				}
			};
			return Backbone.Model.prototype.save.call(this, attrs, newOptions);
		},
		initialize: function() {
			if (this.isNew()) {
				this.set({
					"user_id": null,
					"desc": "",
					"link": "",
					"permission": "commons"
				});
			}

			this.on("nowPrivate", function() {
				var removeTopicData = {
					topicid: this.id
				};

				$(document).trigger(Mapmaker.JIT.events.removeTopic, [removeTopicData]);
			});
			this.on("noLongerPrivate", function() {
				var newTopicData = {
					mappingid: this.getMapping().id,
					topicid: this.id
				};

				$(document).trigger(Mapmaker.JIT.events.newTopic, [newTopicData]);
			});

			//this.on("change:metacode_id", Mapmaker.Filter.checkMetacodes, this);

		},
		authorizeToEdit: function(mapper) {
			if (mapper && (this.get("permission") === "commons" || this.get("user_id") === mapper.get(
				"id"))) return true;
			else return false;
		},
		authorizePermissionChange: function(mapper) {
			if (mapper && this.get("user_id") === mapper.get("id")) return true;
			else return false;
		},
		getDate: function() {

		},
		getMetacode: function() {
			return Mapmaker.Metacodes.get(this.get("metacode_id"));
		},
		getMapping: function() {

			if (!Mapmaker.Active.Map) return false;

			return Mapmaker.Mappings.findWhere({
				map_id: Mapmaker.Active.Map.id,
				topic_id: this.isNew() ? this.cid : this.id
			});
		}
	}); // Backbone.Model.extend

}());
