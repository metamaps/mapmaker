Metamaps.MetacodeSetSwitchView = (function($) {

	var metacodeSetSwitchView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "metacodeSetSwitchView";

		var html = document.getElementById("metacodeSetSwitchTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(metacodeSetSwitchView.prototype, Metamaps.Mixins.Visibility);

	metacodeSetSwitchView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	metacodeSetSwitchView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new metacodeSetSwitchView());
}(jQuery));

/**
 * @class
 * @static
 */
Metamaps.MetacodeSetSwitchView.events = {
	switch: "Metamaps:MetacodeSetSwitchView:switch"
};


