Mapmaker.MetacodeCollection = Backbone.Collection.extend({
	model: Mapmaker.Metacode,
	url: "/metacodes",
	comparator: function(a, b) {
		a = a.get("name").toLowerCase();
		b = b.get("name").toLowerCase();
		return a > b ? 1 : a < b ? -1 : 0;
	}
});

Mapmaker.TopicCollection = Backbone.Collection.extend({
	model: Mapmaker.Topic,
	url: "/topics"
});

Mapmaker.SynapseCollection = Backbone.Collection.extend({
	model: Mapmaker.Synapse,
	url: "/synapses"
});

Mapmaker.MappingCollection = Backbone.Collection.extend({
	model: Mapmaker.Mapping,
	url: "/mappings"
});

Mapmaker.MapsCollection = Backbone.Collection.extend({
	model: Mapmaker.Map,
	initialize: function(models, options) {
		this.id = options.id;
		this.sortBy = options.sortBy;

		if (options.mapperId) {
			this.mapperId = options.mapperId;
		}

		// this.page represents the NEXT page to fetch
		this.page = models.length > 0 ? (models.length < 20 ? "loadedAll" : 2) : 1;
	},
	url: function() {
		if (!this.mapperId) {
			return "/explore/" + this.id + ".json";
		} else {
			return "/explore/mapper/" + this.mapperId + ".json";
		}
	},
	comparator: function(a, b) {
		a = a.get(this.sortBy);
		b = b.get(this.sortBy);
		var temp;
		if (this.sortBy === "name") {
			a = a ? a.toLowerCase() : "";
			b = b ? b.toLowerCase() : "";
		} else {
			// this is for updated_at and created_at
			temp = a;
			a = b;
			b = temp;
		}
		return a > b ? 1 : a < b ? -1 : 0;
	},
	getMaps: function() {
		var self = this;

		if (this.page != "loadedAll") {
			var numBefore = this.length;
			this.fetch({
				remove: false,
				data: {
					page: this.page
				},
				success: function(collection, response, options) {
					// you can pass additional options to the event you trigger here as well
					if (collection.length - numBefore < 20) self.page = "loadedAll";
					else self.page += 1;
					self.trigger("successOnFetch");
				},
				error: function(collection, response, options) {
					// you can pass additional options to the event you trigger here as well
					self.trigger("errorOnFetch");
				}
			});
		} else {
			self.trigger("successOnFetch");
		}
	}
});

Mapmaker.MapperCollection = Backbone.Collection.extend({
	model: Mapmaker.Mapper,
	url: "/users"
});
