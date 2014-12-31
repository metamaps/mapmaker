Metamaps.TopicMappingView = (function($) {
	
	var topicView = function() {
		Metamaps.MappingView.call(this);
	};

	topicView.prototype = new Metamaps.MappingView();
	topicView.prototype.constructor = topicView;


	return topicView;
}(jQuery));