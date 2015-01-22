Mapmaker.NewTopicView = (function($) {

	var Private = {
		
	};

	var newTopicView = function() {
		this.events = {
			"keyup [data-mm-topic-name]" : "setName",
		};

		this.className = "newTopicView";

		var html = document.getElementById("newTopicTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(newTopicView.prototype, Mapmaker.Mixins.Visibility);

	newTopicView.prototype.initialize = function (options) {
		_.extend(this, _.pick(options, "mapView"));

		this.name = '';
    this.newId = 1;
    this.metacode = null;
    this.x = null;
    this.y = null;
	};

	newTopicView.prototype.render = function () {
		this.$el.html(this.template.render());

    // TODO: add in initialize typeahead here

		return this;
	};

	newTopicView.prototype.setName = function (e) {
		this.name = this.$("[data-mm-topic-name]").val();
	};

	newTopicView.prototype.initializeCarousel = function (metacodes) {
		var
			self = this,
      string = '';

		this.$('[data-mm-metacode-title]').empty();

		// metacodes must be a MetacodeCollection
		metacodes.each(function(metacode){
       string += '<img class="cloudcarousel" width="40" height="40" src="' + metacode.get('icon') + '" data-id="' + metacode.id + '" title="' + metacode.get('name') + '" alt="' + metacode.get('name') + '"/>';
    });

		this.$('[data-mm-topic-metacode-image]')
			.empty()
			.append(string)
			.CloudCarousel({
        titleBox: this.$('[data-mm-metacode-title]'),
        yRadius: 40,
        xRadius: 190,
        xPos: 170,
        yPos: 40,
        speed: 0.3,
        mouseWheel: true,
        bringToFront: true,
        tabbingEl: this.$el,
        callback: function (id) {
        	self.metacode = id;
        }
    });
	};

	return Backbone.View.extend(new newTopicView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.NewTopicView.events = {
  switchSet: 'Mapmaker:NewTopicView:switchSet',
	create: 'Mapmaker:NewTopicView:create'
};
