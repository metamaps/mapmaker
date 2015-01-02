Metamaps.Metacode = (function() {

	return Backbone.Model.extend({
		initialize: function() {
			var image = new Image();
			image.crossOrigin = "Anonymous";
			image.src = this.get("icon");
			this.set("image", image);
		},
		prepareLiForFilter: function() {
			var li = "";
			li += "<li data-id=\"" + this.id.toString() + "\">";      
			li += "<img src=\"" + this.get("icon") + "\" data-id=\"" + this.id.toString() + "\"";
			li += " alt=\"" + this.get("name") + "\" />";      
			li += "<p>" + this.get("name").toLowerCase() + "</p></li>";
			return li;
		}
	}); // Backbone.Model.extend

}());
