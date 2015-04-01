if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Maker = (function($) {

	/**
	 * The public interface for the map maker component
	 * @class Mapmaker.Maker
	 * @param {Mapmaker.MapView} view
	 * @param {Object} room
	 */
	var Maker = function(view, map) {
		/**
		 * The view object associated with the maker
		 * @property {Object}
		 */
		this.view = view;
		/**
		 * The renderer's current map
		 * @property {Mapmaker.Map}
		 */
		this.map = map;
	};

	Maker.prototype.launch = function (id) {
      var bb = Mapmaker.Backbone;
      var start = function (data) {
          Mapmaker.Active.Map = new bb.Map(data.map);
          Mapmaker.Mappers = new bb.MapperCollection(data.mappers);
          Mapmaker.Topics = new bb.TopicCollection(data.topics);
          Mapmaker.Synapses = new bb.SynapseCollection(data.synapses);
          Mapmaker.Mappings = new bb.MappingCollection(data.mappings);
          Mapmaker.Backbone.attachCollectionEvents();

          var map = Mapmaker.Active.Map;
          var mapper = Mapmaker.Active.Mapper;

          // add class to .wrapper for specifying whether you can edit the map
          if (map.authorizeToEdit(mapper)) {
              $('.wrapper').addClass('canEditMap');
          }

          // add class to .wrapper for specifying if the map can
          // be collaborated on
          if (map.get('permission') === 'commons') {
              $('.wrapper').addClass('commonsMap');
          }

          // set filter mapper H3 text
          $('#filter_by_mapper h3').html('MAPPERS');

          // build and render the visualization
          Mapmaker.Visualize.type = "ForceDirected";
          Mapmaker.JIT.prepareVizData();

          // update filters
          Mapmaker.Filter.reset(); 

          // reset selected arrays
          Mapmaker.Selected.reset();

          // set the proper mapinfobox content
          Mapmaker.Map.InfoBox.load();

          // these three update the actual filter box with the right list items
          Mapmaker.Filter.checkMetacodes();
          Mapmaker.Filter.checkSynapses();
          Mapmaker.Filter.checkMappers();

          Mapmaker.Realtime.startActiveMap();
          Mapmaker.Loading.hide();
      }

      $.ajax({
          url: "/maps/" + id + "/contains.json",
          success: start
      });
  }

	Maker.prototype.exportImage = function() {

      var canvas = {};

      canvas.canvas = document.createElement("canvas");
      canvas.canvas.width  =  1880; // 960;
      canvas.canvas.height = 1260; // 630

      canvas.scaleOffsetX = 1;
      canvas.scaleOffsetY = 1;
      canvas.translateOffsetY = 0;
      canvas.translateOffsetX = 0;
      canvas.denySelected = true;

      canvas.getSize =  function() {
          if(this.size) return this.size;
          var canvas = this.canvas;
          return this.size = {
              width: canvas.width,
              height: canvas.height
          };
      };
      canvas.scale = function(x, y) {
          var px = this.scaleOffsetX * x,
              py = this.scaleOffsetY * y;
          var dx = this.translateOffsetX * (x -1) / px,
              dy = this.translateOffsetY * (y -1) / py;
          this.scaleOffsetX = px;
          this.scaleOffsetY = py;
          this.getCtx().scale(x, y);
          this.translate(dx, dy);
      };
      canvas.translate = function(x, y) {
          var sx = this.scaleOffsetX,
              sy = this.scaleOffsetY;
          this.translateOffsetX += x*sx;
          this.translateOffsetY += y*sy;
          this.getCtx().translate(x, y); 
      };
      canvas.getCtx = function() {
        return this.canvas.getContext("2d");
      };
      // center it
      canvas.getCtx().translate(1880/2, 1260/2);

      var mGraph = this.view.Visualize.mGraph;

      var id = mGraph.root;
      var root = mGraph.graph.getNode(id);
      var T = !!root.visited;

      // pass true to avoid basing it on a selection
      this.view.JIT.zoomExtents(null, canvas, true);

      var c = canvas.canvas,
          ctx = canvas.getCtx(),
          scale = canvas.scaleOffsetX;

      // draw a grey background
      ctx.fillStyle = '#d8d9da';
      var xPoint = (-(c.width/scale)/2) - (canvas.translateOffsetX/scale),
      yPoint = (-(c.height/scale)/2) - (canvas.translateOffsetY/scale);
      ctx.fillRect(xPoint,yPoint,c.width/scale,c.height/scale);

      // draw the graph
      mGraph.graph.eachNode(function(node) {
         var nodeAlpha = node.getData('alpha');
         node.eachAdjacency(function(adj) {
           var nodeTo = adj.nodeTo;
           if(!!nodeTo.visited === T && node.drawn && nodeTo.drawn) {
             mGraph.fx.plotLine(adj, canvas);
           }
         });
         if(node.drawn) {
           mGraph.fx.plotNode(node, canvas);
         }
         if(!mGraph.labelsHidden) {
           if(node.drawn && nodeAlpha >= 0.95) {
             mGraph.labels.plotLabel(canvas, node);
           } else {
             mGraph.labels.hideLabel(node, false);
           }
         }
         node.visited = !T;
       });
      
      var imageData = {
          encoded_image: canvas.canvas.toDataURL()
      };

      var map = this.map;

      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; //January is 0!
      var yyyy = today.getFullYear();
      if(dd<10) {
          dd='0'+dd
      } 
      if(mm<10) {
          mm='0'+mm
      }
      today = mm+'/'+dd+'/'+yyyy;

      var mapName = map.get("name").split(" ").join([separator = '-']);
      var downloadMessage = "";
      downloadMessage += "Captured map screenshot! ";
      downloadMessage += "<a href='" + imageData.encoded_image + "' ";
      downloadMessage += "download='metamap-" + map.id + "-" + mapName + "-" + today + ".png'>DOWNLOAD</a>";
      // TODO Mapmaker.GlobalUI.notifyUser(downloadMessage);

      $.ajax({
          type: "POST",
          dataType: 'json',
          url: "/maps/" + this.map.id + "/upload_screenshot",
          data: imageData,
          success: function (data) {
              console.log('successfully uploaded map screenshot');
          },
          error: function () {
              console.log('failed to save map screenshot');
          }
      });
  }

  Maker.prototype.export = function() {
    var object = {};

    object.map = this.map.toJSON();
    delete object.map.arranged;
    delete object.map.featured;

    object.messages = this.map.get('messages').models;
    object.messages = object.messages.map(function (message) { return message.attributes; });
    object.mappings = this.map.get('topicMappings').models.concat(this.map.get('synapseMappings').models);
    object.mappings = object.mappings.map(function (mapping) { return mapping.attributes; });
    object.topics = this.map.get('topics').models.map(function (topic) { return topic.attributes; });
    object.synapses = this.map.get('synapses').models.map(function (synapse) { return synapse.attributes; });
    return object;
  };

	return Maker;
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.Maker.events = {
	/**
	 * Fired whenever the map definition changes
	 * @event
	 */
	mapChanged: "Mapmaker:mapChanged"
};
