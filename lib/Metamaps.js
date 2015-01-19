if (typeof Mapmaker === 'undefined') Mapmaker = {};

// TODO eliminate these 4 global variables
var panningInt; // this variable is used to store a 'setInterval' for the Mapmaker.JIT.SmoothPanning() function, so that it can be cleared with window.clearInterval
var tempNode = null,
    tempInit = false,
    tempNode2 = null;

/*
 *
 *   TOPIC
 *
 */
Mapmaker.Topic = {
    // this function is to retrieve a topic JSON object from the database
    // @param id = the id of the topic to retrieve
    get: function (id, callback) {
        // if the desired topic is not yet in the local topic repository, fetch it
        if (Mapmaker.Topics.get(id) == undefined) {
            //console.log("Ajax call!");
            if (!callback) {
                var e = $.ajax({
                    url: "/topics/" + id + ".json",
                    async: false
                });
                Mapmaker.Topics.add($.parseJSON(e.responseText));
                return Mapmaker.Topics.get(id);
            } else {
                return $.ajax({
                    url: "/topics/" + id + ".json",
                    success: function (data) {
                        Mapmaker.Topics.add(data);
                        callback(Mapmaker.Topics.get(id));
                    }
                });
            }
        } else {
            if (!callback) {
                return Mapmaker.Topics.get(id);
            } else {
                return callback(Mapmaker.Topics.get(id));
            }
        }
    }
}; // end Mapmaker.Topic


/*
 *
 *   SYNAPSE
 *
 */
Mapmaker.Synapse = {
    // this function is to retrieve a synapse JSON object from the database
    // @param id = the id of the synapse to retrieve
    get: function (id, callback) {
        // if the desired topic is not yet in the local topic repository, fetch it
        if (Mapmaker.Synapses.get(id) == undefined) {
            if (!callback) {
                var e = $.ajax({
                    url: "/synapses/" + id + ".json",
                    async: false
                });
                Mapmaker.Synapses.add($.parseJSON(e.responseText));
                return Mapmaker.Synapses.get(id);
            } else {
                return $.ajax({
                    url: "/synapses/" + id + ".json",
                    success: function (data) {
                        Mapmaker.Synapses.add(data);
                        callback(Mapmaker.Synapses.get(id));
                    }
                });
            }
        } else {
            if (!callback) {
                return Mapmaker.Synapses.get(id);
            } else {
                return callback(Mapmaker.Synapses.get(id));
            }
        }
    }
}; // end Mapmaker.Synapse


/*
 *
 *   MAP
 *
 */
Mapmaker.Map = {
    events: {
        editedByActiveMapper: "Mapmaker:Map:events:editedByActiveMapper"
    },
    nextX: 0,
    nextY: 0,
    sideLength: 1,
    turnCount: 0,
    nextXshift: 1,
    nextYshift: 0,
    timeToTurn: 0,
    init: function () {
        var self = Mapmaker.Map;

        // prevent right clicks on the main canvas, so as to not get in the way of our right clicks
        $('#center-container').bind('contextmenu', function (e) {
            return false;
        });

        $('.sidebarFork').click(function () {
            self.fork();
        });

        Mapmaker.GlobalUI.CreateMap.emptyForkMapForm = $('#fork_map').html();

        self.InfoBox.init();
        self.CheatSheet.init();

        $(document).on(Mapmaker.Map.events.editedByActiveMapper, self.editedByActiveMapper);
    },
    end: function () {
        if (Mapmaker.Active.Map) {

            $('.wrapper').removeClass('canEditMap commonsMap');
            Mapmaker.Map.resetSpiral();

            $('.rightclickmenu').remove();
            Mapmaker.TopicCard.hideCard();
            Mapmaker.SynapseCard.hideCard();
            Mapmaker.Create.newTopic.hide();
            Mapmaker.Create.newSynapse.hide();
            Mapmaker.Filter.close();
            Mapmaker.Map.InfoBox.close();
            Mapmaker.Realtime.endActiveMap();
        }
    },
    fork: function () {
        Mapmaker.GlobalUI.openLightbox('forkmap');

        var nodes_data = "",
            synapses_data = "";
        var nodes_array = [];
        var synapses_array = [];
        // collect the unfiltered topics
        Mapmaker.Visualize.mGraph.graph.eachNode(function (n) {
            // if the opacity is less than 1 then it's filtered
            if (n.getData('alpha') === 1) {
                var id = n.getData('topic').id;
                nodes_array.push(id);
                var x, y;
                if (n.pos.x && n.pos.y) {
                    x = n.pos.x;
                    y = n.pos.y;
                } else {
                    var x = Math.cos(n.pos.theta) * n.pos.rho;
                    var y = Math.sin(n.pos.theta) * n.pos.rho;
                }
                nodes_data += id + '/' + x + '/' + y + ',';
            }
        });
        // collect the unfiltered synapses
        Mapmaker.Synapses.each(function(synapse){
            var desc = synapse.get("desc");

            var descNotFiltered = Mapmaker.Filter.visible.synapses.indexOf(desc) > -1;
            // make sure that both topics are being added, otherwise, it 
            // doesn't make sense to add the synapse
            var topicsNotFiltered = nodes_array.indexOf(synapse.get('node1_id')) > -1;
            topicsNotFiltered = topicsNotFiltered && nodes_array.indexOf(synapse.get('node2_id')) > -1;
            if (descNotFiltered && topicsNotFiltered) {
                synapses_array.push(synapse.id);
            }
        });

        synapses_data = synapses_array.join();
        nodes_data = nodes_data.slice(0, -1);

        Mapmaker.GlobalUI.CreateMap.topicsToMap = nodes_data;
        Mapmaker.GlobalUI.CreateMap.synapsesToMap = synapses_data;

    },
    leavePrivateMap: function(){
        var map = Mapmaker.Active.Map;
        Mapmaker.Maps.Active.remove(map);
        Mapmaker.Maps.Featured.remove(map);
        Mapmaker.Router.home();
        Mapmaker.GlobalUI.notifyUser('Sorry! That map has been changed to Private.');
    },
    commonsToPublic: function(){
        Mapmaker.Realtime.turnOff(true); // true is for 'silence'
        Mapmaker.GlobalUI.notifyUser('Map was changed to Public. Editing is disabled.');
        Mapmaker.Active.Map.trigger('changeByOther');
    },
    publicToCommons: function(){
        var confirmString = "This map permission has been changed to Commons! ";
        confirmString += "Do you want to reload and enable realtime collaboration?";
        var c = confirm(confirmString);
        if (c) {
            Mapmaker.Router.maps(Mapmaker.Active.Map.id);
        }
    },
    editedByActiveMapper: function () {
        if (Mapmaker.Active.Mapper) {
            Mapmaker.Mappers.add(Mapmaker.Active.Mapper);
        }
    },
    getNextCoord: function() {
        var self = Mapmaker.Map;
        var nextX = self.nextX;
        var nextY = self.nextY;

        var DISTANCE_BETWEEN = 120;

        self.nextX = self.nextX + DISTANCE_BETWEEN * self.nextXshift;
        self.nextY = self.nextY + DISTANCE_BETWEEN * self.nextYshift;

        self.timeToTurn += 1;
        // if true, it's time to turn
        if (self.timeToTurn === self.sideLength) {
            
            self.turnCount += 1;
            // if true, it's time to increase side length
            if (self.turnCount % 2 === 0) {
                self.sideLength += 1;
            }
            self.timeToTurn = 0;

            // going right? turn down
            if (self.nextXshift == 1 && self.nextYshift == 0) {
                self.nextXshift = 0;
                self.nextYshift = 1;
            }
            // going down? turn left
            else if (self.nextXshift == 0 && self.nextYshift == 1) {
                self.nextXshift = -1;
                self.nextYshift = 0;
            }
            // going left? turn up
            else if (self.nextXshift == -1 && self.nextYshift == 0) {
                self.nextXshift = 0;
                self.nextYshift = -1;
            }
            // going up? turn right
            else if (self.nextXshift == 0 && self.nextYshift == -1) {
                self.nextXshift = 1;
                self.nextYshift = 0;
            }
        }

        return {
            x: nextX,
            y: nextY
        }
    },
    resetSpiral: function() {
        Mapmaker.Map.nextX = 0;
        Mapmaker.Map.nextY = 0;
        Mapmaker.Map.nextXshift = 1;
        Mapmaker.Map.nextYshift = 0;
        Mapmaker.Map.sideLength = 1;
        Mapmaker.Map.timeToTurn = 0;
        Mapmaker.Map.turnCount = 0;
    }
};

Mapmaker.Mapper = {
    // this function is to retrieve a mapper JSON object from the database
    // @param id = the id of the mapper to retrieve
    get: function (id, callback) {
        return $.ajax({
            url: "/users/" + id + ".json",
            success: function (data) {
                callback(new Mapmaker.Backbone.Mapper(data));
            }
        });
    }
};
