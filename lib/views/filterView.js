Metamaps.FilterView = (function($) {

	var filterView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "filterView";

		var html = document.getElementById("filterTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(filterView.prototype, Metamaps.Mixins.Visibility);

	filterView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	filterView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new filterView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.FilterView.events = {
	change: "Metamaps:FilterView:change"
};
