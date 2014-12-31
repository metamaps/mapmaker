Metamaps.MetacodeCollection = Backbone.Collection.extend({
    model: Metamaps.Metacode,
    url: '/metacodes',
    comparator: function (a, b) {
        a = a.get('name').toLowerCase();
        b = b.get('name').toLowerCase();
        return a > b ? 1 : a < b ? -1 : 0;
    }
});

Metamaps.TopicCollection = Backbone.Collection.extend({
    model: Metamaps.Topic,
    url: '/topics'
});

Metamaps.SynapseCollection = Backbone.Collection.extend({
    model: Metamaps.Synapse,
    url: '/synapses'
});

Metamaps.MappingCollection = Backbone.Collection.extend({
    model: Metamaps.Mapping,
    url: '/mappings'
});

Metamaps.MapsCollection = Backbone.Collection.extend({
    model: Metamaps.Map,
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
            return '/explore/' + this.id + '.json';
        }
        else {
            return '/explore/mapper/' + this.mapperId + '.json';
        }
    },
    comparator: function (a, b) {
        a = a.get(this.sortBy);
        b = b.get(this.sortBy);
        var temp;
        if (this.sortBy === 'name') {
            a = a ? a.toLowerCase() : "";
            b = b ? b.toLowerCase() : "";
        }
        else {
            // this is for updated_at and created_at
            temp = a;
            a = b;
            b = temp;
        }
        return a > b ? 1 : a < b ? -1 : 0;
    },
    getMaps: function () {
        var self = this;

        if (this.page != "loadedAll") {
            var numBefore = this.length;
            this.fetch({
                remove: false,
                data: { page: this.page },
                success: function (collection, response, options) {
                    // you can pass additional options to the event you trigger here as well
                    if (collection.length - numBefore < 20) self.page = "loadedAll";
                    else self.page += 1;
                    self.trigger('successOnFetch');
                },
                error: function (collection, response, options) {
                    // you can pass additional options to the event you trigger here as well
                    self.trigger('errorOnFetch');
                }
            });
        }
        else {
            self.trigger('successOnFetch');
        }
    }
});

Metamaps.MapperCollection = Backbone.Collection.extend({
    model: Metamaps.Mapper,
    url: '/users'
});