Metamaps.SynapseCardView = (function($) {

	var synapseCardView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "synapseCardView";

		var html = document.getElementById("synapseCardTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(synapseCardView.prototype, Metamaps.Mixins.Visibility);

	synapseCardView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	synapseCardView.prototype.render = function() {
		this.$el.html(this.template.render(this.model.attributes));
		return this;
	};

	return Backbone.View.extend(new synapseCardView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.SynapseCardView.events = {
	
};
