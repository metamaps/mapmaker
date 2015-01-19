Mapmaker.Mapper = (function() {

	return Backbone.Model.extend({
		urlRoot: '/users',
		blacklist: ['created_at', 'updated_at'],
		toJSON: function(options) {
			return _.omit(this.attributes, this.blacklist);
		},
		prepareLiForFilter: function() {
			var li = '';
			li += '<li data-id="' + this.id.toString() + '">';      
			li += '<img src="' + this.get("image") + '" data-id="' + this.id.toString() + '"';
			li += ' alt="' + this.get('name') + '" />';      
			li += '<p>' + this.get('name') + '</p></li>';
			return li;
		}
	});

}());
