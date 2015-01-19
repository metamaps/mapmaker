if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Create = (function ($) {

    var newTopic = function (mapView) {
        this.mapView = mapView;

        this.name = null;
        this.newId = 1;
        this.beingCreated = false;
        this.metacode = null;
        this.x = null;
        this.y = null;
        this.addSynapse = false;
    };

    newTopic.prototype.init = function () {
        var self = this;

        $('#topic_name').keyup(function () {
            self.name = $(this).val();
        });

        // initialize the autocomplete results for the metacode spinner
        $('#topic_name').typeahead([
            {
                name: 'topic_autocomplete',
                limit: 8,
                template: $('#topicAutocompleteTemplate').html(),
                remote: {
                    url: '/topics/autocomplete_topic?term=%QUERY'
                },
                engine: Hogan
              }
        ]);

        // tell the autocomplete to submit the form with the topic you clicked on if you pick from the autocomplete
        $('#topic_name').bind('typeahead:selected', function (event, datum, dataset) {
            this.mapView.Topic.getTopicFromAutocomplete(datum.id);
        });

        // initialize metacode spinner and then hide it
        $("#metacodeImg").CloudCarousel({
            titleBox: $('#metacodeImgTitle'),
            yRadius: 40,
            xRadius: 190,
            xPos: 170,
            yPos: 40,
            speed: 0.3,
            mouseWheel: true,
            bringToFront: true
        });
        $('.new_topic').hide();
    }

    newTopic.prototype.open = function () {
        $('#new_topic').fadeIn('fast', function () {
            $('#topic_name').focus();
        });
        this.beingCreated = true;
        this.name = "";
    } 

    newTopic.prototype.hide = function () {
        $('#new_topic').fadeOut('fast');
        $("#topic_name").typeahead('setQuery', '');
        this.beingCreated = false;
    }


    var newSynapse = function (mapView) {
        this.mapView = mapView;

        this.beingCreated = false;
        this.description = null;
        this.topic1id = null;
        this.topic2id = null;
        this.newSynapseId = null;
    };

    newSynapse.prototype.init = function () {
        var self = this;

        $('#synapse_desc').keyup(function () {
            this.newSynapse.description = $(this).val();
        });

        // initialize the autocomplete results for synapse creation
        $('#synapse_desc').typeahead([
            {
                name: 'synapse_autocomplete',
                template: "<div class='genericSynapseDesc'>{{label}}</div>",
                remote: {
                    url: '/search/synapses?term=%QUERY'
                },
                engine: Hogan
            },
            {
                name: 'existing_synapses',
                limit: 50,
                template: $('#synapseAutocompleteTemplate').html(),
                remote: {
                    url: '/search/synapses',
                    replace: function () {
                        return self.getSearchQuery();
                    }
                },
                engine: Hogan,
                header: "<h3>Existing synapses</h3>"
            }
      ]);

        $('#synapse_desc').bind('typeahead:selected', function (event, datum, dataset) {
            if (datum.id) { // if they clicked on an existing synapse get it
                this.mapView.Synapse.getSynapseFromAutocomplete(datum.id);
            }
            else {
                self.description = datum.value;
                this.mapView.Synapse.createSynapseLocally();
            }
        });
    }

    newSynapse.prototype.open = function () {
        $('#new_synapse').fadeIn('fast', function () {
            $('#synapse_desc').focus();
        });
        this.beingCreated = true;
    }

    newSynapse.prototype.hide = function () {
        $('#new_synapse').fadeOut('fast');
        $("#synapse_desc").typeahead('setQuery', '');
        this.newSynapse.beingCreated = false;
        this.newTopic.addSynapse = false;
        this.topic1id = 0;
        this.topic2id = 0;
        this.mapView.Mouse.synapseStartCoordinates = [];
        this.mapView.Visualize.mGraph.plot();
    }

    newSynapse.prototype.getSearchQuery = function () {
        var self = this.newSynapse;

        if (this.mapView.Selected.Nodes.length < 2) {
            return '/search/synapses?topic1id=' + self.topic1id + '&topic2id=' + self.topic2id;
        } else return '';
    }

    var create = function (mapView) {
        this.mapView = mapView;

        this.isSwitchingSet = false; // indicates whether the metacode set switch lightbox is open
        this.selectedMetacodeSet = null;
        this.selectedMetacodeSetIndex = null;
        this.selectedMetacodeNames = [];
        this.newSelectedMetacodeNames = [];
        this.selectedMetacodes = [];
        this.newSelectedMetacodes = [];

        this.newTopic = new newTopic(this.mapView);
        this.newSynapse = new newSynapse(this.mapView);
    }

    create.prototype.init = function () {
        var self = this;
        self.newTopic.init();
        self.newSynapse.init();

        //////
        //////
        //// SWITCHING METACODE SETS

        $('#metacodeSwitchTabs').tabs({
            selected: self.selectedMetacodeSetIndex
        }).addClass("ui-tabs-vertical ui-helper-clearfix");
        $("#metacodeSwitchTabs .ui-tabs-nav li").removeClass("ui-corner-top").addClass("ui-corner-left");
        $('.customMetacodeList li').click(self.toggleMetacodeSelected); // within the custom metacode set tab
    }

    create.prototype.toggleMetacodeSelected = function () {
        var self = this;

        if ($(this).attr('class') != 'toggledOff') {
            $(this).addClass('toggledOff');
            var value_to_remove = $(this).attr('id');
            var name_to_remove = $(this).attr('data-name');
            self.newSelectedMetacodes.splice(self.newSelectedMetacodes.indexOf(value_to_remove), 1);
            self.newSelectedMetacodeNames.splice(self.newSelectedMetacodeNames.indexOf(name_to_remove), 1);
        } else if ($(this).attr('class') == 'toggledOff') {
            $(this).removeClass('toggledOff');
            self.newSelectedMetacodes.push($(this).attr('id'));
            self.newSelectedMetacodeNames.push($(this).attr('data-name'));
        }
    }

    create.prototype.updateMetacodeSet = function (set, index, custom) {

        if (custom && this.newSelectedMetacodes.length == 0) {
            alert('Please select at least one metacode to use!');
            return false;
        }

        var codesToSwitchToIds;
        var metacodeModels = new this.mapView.Backbone.MetacodeCollection();
        this.selectedMetacodeSetIndex = index;
        this.selectedMetacodeSet = "metacodeset-" + set;

        if (!custom) {
            codesToSwitchToIds = $('#metacodeSwitchTabs' + set).attr('data-metacodes').split(',');
            $('.customMetacodeList li').addClass('toggledOff');
            this.selectedMetacodes = [];
            this.selectedMetacodeNames = [];
            this.newSelectedMetacodes = [];
            this.newSelectedMetacodeNames = [];
        }
        else if (custom) {
            // uses .slice to avoid setting the two arrays to the same actual array
            this.selectedMetacodes = this.newSelectedMetacodes.slice(0);
            this.selectedMetacodeNames = this.newSelectedMetacodeNames.slice(0);
            codesToSwitchToIds = this.selectedMetacodes.slice(0);
        }

        // sort by name
        for (var i = 0; i < codesToSwitchToIds.length; i++) {
            metacodeModels.add( this.mapView.Metacodes.get(codesToSwitchToIds[i]) );
        };
        metacodeModels.sort();

        $('#metacodeImg, #metacodeImgTitle').empty();
        $('#metacodeImg').removeData('cloudcarousel');
        var newMetacodes = "";
        metacodeModels.each(function(metacode){
            newMetacodes += '<img class="cloudcarousel" width="40" height="40" src="' + metacode.get('icon') + '" data-id="' + metacode.id + '" title="' + metacode.get('name') + '" alt="' + metacode.get('name') + '"/>';
        });
            
        $('#metacodeImg').empty().append(newMetacodes).CloudCarousel({
            titleBox: $('#metacodeImgTitle'),
            yRadius: 40,
            xRadius: 190,
            xPos: 170,
            yPos: 40,
            speed: 0.3,
            mouseWheel: true,
            bringToFront: true
        });

        this.mapView.GlobalUI.closeLightbox();
        $('#topic_name').focus();

        var mdata = {
            "metacodes": {
                "value": custom ? this.selectedMetacodes.toString() : this.selectedMetacodeSet
            }
        };
        $.ajax({
            type: "POST",
            dataType: 'json',
            url: "/user/updatemetacodes",
            data: mdata,
            success: function (data) {
                console.log('selected metacodes saved');
            },
            error: function () {
                console.log('failed to save selected metacodes');
            }
        });
    }

    create.prototype.cancelMetacodeSetSwitch = function () {
        var self = this;
        self.isSwitchingSet = false;

        if (self.selectedMetacodeSet != "metacodeset-custom") {
            $('.customMetacodeList li').addClass('toggledOff');
            self.selectedMetacodes = [];
            self.selectedMetacodeNames = [];
            self.newSelectedMetacodes = [];
            self.newSelectedMetacodeNames = [];
        } else { // custom set is selected
            // reset it to the current actual selection
            $('.customMetacodeList li').addClass('toggledOff');
            for (var i = 0; i < self.selectedMetacodes.length; i++) {
                $('#' + self.selectedMetacodes[i]).removeClass('toggledOff');
            };
            // uses .slice to avoid setting the two arrays to the same actual array
            self.newSelectedMetacodeNames = self.selectedMetacodeNames.slice(0);
            self.newSelectedMetacodes = self.selectedMetacodes.slice(0);
        }
        $('#metacodeSwitchTabs').tabs("select", self.selectedMetacodeSetIndex);
        $('#topic_name').focus();
    }

    return create;
}(jQuery));
