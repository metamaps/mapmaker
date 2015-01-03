Metamaps.MapInfoBoxView = (function($) {

	var mapInfoBoxView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "mapInfoBoxView";

		var html = document.getElementById("mapInfoBoxTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(mapInfoBoxView.prototype, Metamaps.Mixins.Visibility);

	mapInfoBoxView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	mapInfoBoxView.prototype.render = function() {
		this.$el.html(this.template.render(this.model.attributes));
		return this;
	};

	return Backbone.View.extend(new mapInfoBoxView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.MapInfoBoxView.events = {
	
};
