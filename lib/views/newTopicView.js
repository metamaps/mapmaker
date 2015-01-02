Metamaps.NewTopicView = (function($) {

	var View = function(view) {
		this.view = view;
		this.setSwitcher = new Metamaps.MetacodeSetSwitchView(this, this.view);
	};

	return View;
}(jQuery));
