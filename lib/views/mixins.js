Metamaps.Mixins = (function() { 
	
	var Mixins = {};

	Mixins.Visibility = {
		toggle: function() {
			
		},
		show: function() {
			this.$el.fadeIn("fast");
		},
		hide: function() {
			this.$el.fadeOut("fast");
		}
	};

	return Mixins;
}());