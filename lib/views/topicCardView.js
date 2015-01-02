Metamaps.TopicCardView = (function($) {

	var topicCardView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .show_notes"       : "toggleNotes",
			"click .title .lock"      : "editAccessLevel",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "topicCardView";

		var html = document.getElementById("topicCardTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(topicCardView.prototype, Metamaps.Mixins.Visibility);

	topicCardView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	topicCardView.prototype.render = function() {
		this.$el.html(this.template.render(this.model.attributes));
		return this;
	};

	return Backbone.View.extend(new topicCardView());
}(jQuery));
