Metamaps.NewTopicView = (function($) {

	var newTopicView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "newTopicView";

		var html = document.getElementById("newTopicTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(newTopicView.prototype, Metamaps.Mixins.Visibility);

	newTopicView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	newTopicView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new newTopicView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.NewTopicView.events = {
	create: "Metamaps:NewTopicView:create"
};
