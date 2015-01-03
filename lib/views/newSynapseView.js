Metamaps.NewSynapseView = (function($) {

	var newSynapseView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "newSynapseView";

		var html = document.getElementById("newSynapseTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(newSynapseView.prototype, Metamaps.Mixins.Visibility);

	newSynapseView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	newSynapseView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new newSynapseView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.NewSynapseView.events = {
	create: "Metamaps:NewSynapseView:create"
};
