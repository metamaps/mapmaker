Mapmaker.Mixins = (function() { 
	
	var Mixins = {};

	Mixins.Visibility = {
		toggle: function() {
			if (this.isOpen) {
				this.hide();
			} else this.show();
		},
		show: function() {
			this.$el.fadeIn("fast");
			this.isOpen = true;
		},
		hide: function() {
			this.$el.fadeOut("fast");
			this.isOpen = false;
		},
		isOpen: true
	};

	return Mixins;
}());