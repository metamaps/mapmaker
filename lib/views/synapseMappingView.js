Metamaps.SynapseMappingView = (function($) {
	
	var synapseView = function() {
		Metamaps.MappingView.call(this);
	};

	synapseView.prototype = new Metamaps.MappingView();
	synapseView.prototype.constructor = synapseView;

	
	return synapseView;
}(jQuery));