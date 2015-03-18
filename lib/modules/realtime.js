if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Realtime = (function ($) {

    var realtime = function (mapView) {
        this.mapView = mapView;

        this.$parent = mapView.$parent;

        this.$myVideo = $('<video id="video-wrapper"></video>');

        this.webRtcUrl = 'http://localhost:5002';

        this.stringForLocalhost = 'http://localhost:5002';
        this.stringForMetamaps = 'http://metamaps.cc:5001';
        this.stringForHeroku = 'http://gentle-savannah-1303.herokuapp.com';
        this.socket = null;
        this.isOpen = false;
        this.changing = false;
        this.mappersOnMap = {};
        this.status = true; // stores whether realtime is True/On or False/Off
    }

    realtime.prototype.init = function () {
        var self = this;

        var reenableRealtime = function () {
            self.reenableRealtime();
        };
        var turnOff = function () {
            self.turnOff();
        };
        $(".rtOn").click(reenableRealtime);
        $(".rtOff").click(turnOff);

        $('.sidebarCollaborateIcon').click(self.toggleBox);
        $('.sidebarCollaborateBox').click(function(event){ 
            event.stopPropagation();
        });
        $('body').click(self.close);

        var railsEnv = 'development';
        var whichToConnect = railsEnv === 'development' ? self.stringForLocalhost : self.stringForHeroku;
        self.socket = io.connect(whichToConnect);
        self.socket.on('connect', function () {
            self.startActiveMap();
        });

        this.initVideo();
    }

    realtime.prototype.initVideo = function () {
      var self = this;

      this.webrtc = new SimpleWebRTC({
          localVideoEl: this.$myVideo.attr('id'),
          remoteVideosEl: '',
          url: this.webRtcUrl,
          detectSpeakingEvents: true,
          autoAdjustMic: false,
          autoRequestMedia: true,
          localVideo: {
              autoplay: true,
              mirror: true,
              muted: true
          },
          media: {
            video: true,
            audio: true
          }
      });

      // we have to wait until it's ready
      this.webrtc.on('readyToCall', function () {
          // you can name it anything
          self.webrtc.joinRoom('map' + self.mapView.currentMap.id, function (err, roomDescription) {
            if (err) console.log(err);
            else console.log('we joined the room!');
          });
      });

      this.webrtc.createRoom('map' + self.mapView.currentMap.id, function (err, roomName) {
          if (err) console.log('room already created');
          else console.log('created room: ' + roomName);
      });

      this.webrtc.on('videoAdded', this.addVideo.bind(this));

      this.webrtc.on('videoRemoved', this.removeVideo.bind(this));
    }

    realtime.prototype.addVideo = function (video, peer) {

        var $container = $('<div></div>');
        $container.addClass('collaborator-video');
        $container.attr('id', 'container_' + this.webrtc.getDomId(peer));
        $container.append(video);

        // suppress contextmenu
        video.oncontextmenu = function () { return false; };

        this.$parent.append($container);

        // random position for now
        var top = Math.floor((Math.random() * (this.$parent.height() - 100)) + 1);
        var left = Math.floor((Math.random() * (this.$parent.width() - 100)) + 1);
        $container.css({
            top: top + 'px',
            left: left + 'px'
        });
    }

    realtime.prototype.removeVideo = function (video, peer) {

        var $el = $(peer ? '#container_' + this.webrtc.getDomId(peer) : '');
        if ($el) {
          $el.remove();
        }
    }

    realtime.prototype.toggleBox = function (event) {
        var self = this;

        if (self.isOpen) self.close();
        else self.open();

        event.stopPropagation();
    }

    realtime.prototype.open = function () {
        var self = this;

        this.mapView.GlobalUI.Account.close();
        this.mapView.Filter.close();
        $('.sidebarCollaborateIcon div').addClass('hide');

        if (!self.isOpen && !self.changing) {
            self.changing = true;
            $('.sidebarCollaborateBox').fadeIn(200, function () {
                self.changing = false;
                self.isOpen = true;
            });
        }
    }

    realtime.prototype.close = function () {
        var self = this;
        $(".sidebarCollaborateIcon div").removeClass('hide');
        if (!self.changing) {
            self.changing = true;
            $('.sidebarCollaborateBox').fadeOut(200, function () {
                self.changing = false;
                self.isOpen = false;
            });
        }
    }

    realtime.prototype.startActiveMap = function () {
        var self = this;

        if (this.mapView.currentMap && this.mapView.currentMapper) {
            var commonsMap = this.mapView.currentMap.get('permission') === 'commons';
            var publicMap = this.mapView.currentMap.get('permission') === 'public';

            if (commonsMap) {
                self.turnOn();
                self.setupSocket();
            }
            else if (publicMap) {
                self.attachMapListener();
            }
        }
    }

    realtime.prototype.endActiveMap = function () {
        var self = this;

        $(document).off('mousemove');
        self.socket.removeAllListeners();
        self.socket.emit('endMapperNotify');
        $(".collabCompass").remove();
        self.status = false;
    }

    realtime.prototype.reenableRealtime = function() {
        var confirmString = "The layout of your map has fallen out of sync with the saved copy. ";
        confirmString += "To save your changes without overwriting the map, hit 'Cancel' and ";
        confirmString += "then use 'Save to new map'. ";
        confirmString += "Do you want to discard your changes and enable realtime?";
        var c = confirm(confirmString);
        if (c) {
            this.mapView.Router.maps(this.mapView.currentMap.id);
        }
    }

    realtime.prototype.turnOn = function (notify) {
        var self = this;

        if (notify) self.sendRealtimeOn();
        $(".rtMapperSelf").removeClass('littleRtOff').addClass('littleRtOn');
        $('.rtOn').addClass('active');
        $('.rtOff').removeClass('active');
        self.status = true;
        $(".sidebarCollaborateIcon").addClass("blue");
        $(".collabCompass").show();
    }

    realtime.prototype.turnOff = function (silent) {
        var self = this;

        if (self.status) {
            if (!silent) self.sendRealtimeOff();
            $(".rtMapperSelf").removeClass('littleRtOn').addClass('littleRtOff');
            $('.rtOn').removeClass('active');
            $('.rtOff').addClass('active');
            self.status = false;
            $(".sidebarCollaborateIcon").removeClass("blue");
            $(".collabCompass").hide();
        }
    }

    realtime.prototype.setupSocket = function () {
        var self = this;
        var socket = this.socket;
        var myId = this.mapView.currentMapper.id;
        
        socket.emit('newMapperNotify', {
            userid: myId,
            username: this.mapView.currentMapper.get("name"),
            userimage: this.mapView.currentMapper.get("image"),
            mapid: this.mapView.currentMap.id
        });

        // if you're the 'new guy' update your list with who's already online
        socket.on(myId + '-' + this.mapView.currentMap.id + '-UpdateMapperList', self.updateMapperList.bind(self));

        // receive word that there's a new mapper on the map
        socket.on('maps-' + this.mapView.currentMap.id + '-newmapper', self.newPeerOnMap.bind(self));

        // receive word that a mapper left the map
        socket.on('maps-' + this.mapView.currentMap.id + '-lostmapper', self.lostPeerOnMap.bind(self));

        // receive word that there's a mapper turned on realtime
        socket.on('maps-' + this.mapView.currentMap.id + '-newrealtime', self.newCollaborator.bind(self));

        // receive word that there's a mapper turned on realtime
        socket.on('maps-' + this.mapView.currentMap.id + '-lostrealtime', self.lostCollaborator.bind(self));

        //
        socket.on('maps-' + this.mapView.currentMap.id + '-topicDrag', self.topicDrag.bind(self));

        //
        socket.on('maps-' + this.mapView.currentMap.id + '-newTopic', self.newTopic.bind(self));

        //
        socket.on('maps-' + this.mapView.currentMap.id + '-removeTopic', self.removeTopic.bind(self));

        //
        socket.on('maps-' + this.mapView.currentMap.id + '-newSynapse', self.newSynapse.bind(self));

        //
        socket.on('maps-' + this.mapView.currentMap.id + '-removeSynapse', self.removeSynapse.bind(self));

        // update mapper compass position
        socket.on('maps-' + this.mapView.currentMap.id + '-updatePeerCoords', self.updatePeerCoords.bind(self));

        // deletions
        socket.on('deleteTopicFromServer', self.removeTopic);
        socket.on('deleteSynapseFromServer', self.removeSynapse);

        socket.on('topicChangeFromServer', self.topicChange);
        socket.on('synapseChangeFromServer', self.synapseChange);
        self.attachMapListener();
    
        // local event listeners that trigger events
        var sendCoords = function (event) {
            var pixels = {
                x: event.pageX,
                y: event.pageY
            };
            var coords = Mapmaker.Utility.pixelsToCoords(pixels, self.mapView);
            self.sendCoords(coords);
        };
        $(document).mousemove(sendCoords);

        var zoom = function (event, e) {
            if (e) {
                var pixels = {
                    x: e.pageX,
                    y: e.pageY
                };
                var coords = Mapmaker.Utility.pixelsToCoords(pixels, self.mapView);
                self.sendCoords(coords);
            }
            self.positionPeerIcons();
        };
        $(document).on(Mapmaker.JIT.events.zoom, zoom);

        $(document).on(Mapmaker.JIT.events.pan, self.positionPeerIcons);

        var sendTopicDrag = function (event, positions) {
            self.sendTopicDrag(positions);
        };
        $(document).on(Mapmaker.JIT.events.topicDrag, sendTopicDrag);

        var sendNewTopic = function (event, data) {
            self.sendNewTopic(data);
        };
        $(document).on(Mapmaker.JIT.events.newTopic, sendNewTopic);

        var sendDeleteTopic = function (event, data) {
            self.sendDeleteTopic(data);
        };
        $(document).on(Mapmaker.JIT.events.deleteTopic, sendDeleteTopic);

        var sendRemoveTopic = function (event, data) {
            self.sendRemoveTopic(data);
        };
        $(document).on(Mapmaker.JIT.events.removeTopic, sendRemoveTopic);

        var sendNewSynapse = function (event, data) {
            self.sendNewSynapse(data);
        };
        $(document).on(Mapmaker.JIT.events.newSynapse, sendNewSynapse);

        var sendDeleteSynapse = function (event, data) {
            self.sendDeleteSynapse(data);
        };
        $(document).on(Mapmaker.JIT.events.deleteSynapse, sendDeleteSynapse);

        var sendRemoveSynapse = function (event, data) {
            self.sendRemoveSynapse(data);
        };
        $(document).on(Mapmaker.JIT.events.removeSynapse, sendRemoveSynapse);
    }

    realtime.prototype.attachMapListener = function(){
        var self = this;
        var socket = this.socket;

        socket.on('mapChangeFromServer', self.mapChange);
    }

    realtime.prototype.sendRealtimeOn = function () {
        var self = this;
        var socket = this.socket;

        // send this new mapper back your details, and the awareness that you're online
        var update = {
            username: this.mapView.currentMapper.get("name"),
            userid: this.mapView.currentMapper.id,
            mapid: this.mapView.currentMap.id
        };
        socket.emit('notifyStartRealtime', update);
    }

    realtime.prototype.sendRealtimeOff = function () {
        var self = this;
        var socket = this.socket;

        // send this new mapper back your details, and the awareness that you're online
        var update = {
            username: this.mapView.currentMapper.get("name"),
            userid: this.mapView.currentMapper.id,
            mapid: this.mapView.currentMap.id
        };
        socket.emit('notifyStopRealtime', update);
    }

    realtime.prototype.updateMapperList = function (data) {
        var self = this;
        var socket = this.socket;

        // data.userid
        // data.username
        // data.userimage
        // data.userrealtime

        self.mappersOnMap[data.userid] = {
            name: data.username,
            image: data.userimage,
            color: Mapmaker.Utility.getPastelColor(),
            realtime: data.userrealtime,
            coords: {
                x: 0, 
                y: 0
            },
        };

        var onOff = data.userrealtime ? "On" : "Off";
        var mapperListItem = '<li id="mapper';
        mapperListItem += data.userid;
        mapperListItem += '" class="rtMapper littleRt';
        mapperListItem += onOff;
        mapperListItem += '">';
        mapperListItem += '<img style="border: 2px solid ' + self.mappersOnMap[data.userid].color + ';"';
        mapperListItem += ' src="' + data.userimage + '" width="24" height="24" class="rtUserImage" />';
        mapperListItem += data.username;
        mapperListItem += '<div class="littleJuntoIcon"></div>';
        mapperListItem += '</li>';

        if (data.userid !== this.mapView.currentMapper.id) {
            $('#mapper' + data.userid).remove();
            $('.realtimeMapperList ul').append(mapperListItem);

            // create a div for the collaborators compass
            self.createCompass(data.username, data.userid, data.userimage, self.mappersOnMap[data.userid].color, !self.status);
        }
    }

    realtime.prototype.newPeerOnMap = function (data) {
        var self = this;
        var socket = this.socket;

        // data.userid
        // data.username
        // data.userimage
        // data.coords

        self.mappersOnMap[data.userid] = {
            name: data.username,
            image: data.userimage,
            color: Mapmaker.Utility.getPastelColor(),
            realtime: true,
            coords: {
                x: 0, 
                y: 0
            },
        };

        // create an item for them in the realtime box
        if (data.userid !== this.mapView.currentMapper.id && self.status) {
            var mapperListItem = '<li id="mapper' + data.userid + '" class="rtMapper littleRtOn">';
            mapperListItem += '<img style="border: 2px solid ' + self.mappersOnMap[data.userid].color + ';"';
            mapperListItem += ' src="' + data.userimage + '" width="24" height="24" class="rtUserImage" />';
            mapperListItem += data.username;
            mapperListItem += '<div class="littleJuntoIcon"></div>';
            mapperListItem += '</li>';
            $('#mapper' + data.userid).remove();
            $('.realtimeMapperList ul').append(mapperListItem);

            // create a div for the collaborators compass
            self.createCompass(data.username, data.userid, data.userimage, self.mappersOnMap[data.userid].color, !self.status);
            
            console.log(data.username + ' just joined the map');

            // send this new mapper back your details, and the awareness that you've loaded the map
            var update = {
                userToNotify: data.userid,
                username: this.mapView.currentMapper.get("name"),
                userimage: this.mapView.currentMapper.get("image"),
                userid: this.mapView.currentMapper.id,
                userrealtime: self.status,
                mapid: this.mapView.currentMap.id
            };
            socket.emit('updateNewMapperList', update);
        }
    }

    realtime.prototype.createCompass = function (name, id, image, color, hide) {
        var str =  '<img width="28" height="28" src="'+image+'" /><p>'+name+'</p>';
        str += '<div id="compassArrow'+id+'" class="compassArrow"></div>';
        $('#compass' + id).remove();
        $('<div/>', {
            id: 'compass' + id,
            class: 'collabCompass'
        }).html(str).appendTo(this.mapView.$parent);
        if (hide) {
            $('#compass' + id).hide();
        }
        $('#compass' + id + ' img').css({
            'border': '2px solid ' + color
        });
        $('#compass' + id + ' p').css({
            'background-color': color
        });
    }

    realtime.prototype.lostPeerOnMap = function (data) {
        var self = this;
        var socket = this.socket;

        // data.userid
        // data.username

        delete self.mappersOnMap[data.userid];

        $('#mapper' + data.userid).remove();
        $('#compass' + data.userid).remove();

        console.log(data.username + ' just left the map');
    }

    realtime.prototype.newCollaborator = function (data) {
        var self = this;
        var socket = this.socket;

        // data.userid
        // data.username

        self.mappersOnMap[data.userid].realtime = true;

        $('#mapper' + data.userid).removeClass('littleRtOff').addClass('littleRtOn');
        $('#compass' + data.userid).show();

        console.log(data.username + ' just turned on realtime');
    }

    realtime.prototype.lostCollaborator = function (data) {
        var self = this;
        var socket = this.socket;

        // data.userid
        // data.username

        self.mappersOnMap[data.userid].realtime = false;

        $('#mapper' + data.userid).removeClass('littleRtOn').addClass('littleRtOff');
        $('#compass' + data.userid).hide();

        console.log(data.username + ' just turned off realtime');
    }

    realtime.prototype.updatePeerCoords = function (data) {
        var self = this;
        var socket = this.socket;

        if (self.mappersOnMap[data.userid]) {
            self.mappersOnMap[data.userid].coords={x: data.usercoords.x,y:data.usercoords.y};
            self.positionPeerIcon(data.userid);
        }
    }

    realtime.prototype.positionPeerIcons = function () {
        var self = this;
        var socket = this.socket;

        if (self.status) { // if i have realtime turned on
            for (var key in self.mappersOnMap) {
                var mapper = self.mappersOnMap[key];
                if (mapper.realtime) {
                    self.positionPeerIcon(key);
                }
            }
        }
    }

    realtime.prototype.positionPeerIcon = function (id) {
        var self = this;
        var socket = this.socket;

        var mapper = self.mappersOnMap[id];
        var xMax=$(document).width();
        var yMax=$(document).height();
        var compassDiameter=56;
        var compassArrowSize=24;
        
        var origPixels = Mapmaker.Utility.coordsToPixels(mapper.coords, self.mapView);
        var pixels = self.limitPixelsToScreen(origPixels);
        $('#compass' + id).css({
            left: pixels.x + 'px',
            top: pixels.y + 'px'
        });
        /* showing the arrow if the collaborator is off of the viewport screen */
        if (origPixels.x !== pixels.x || origPixels.y !== pixels.y) {

            var dy = origPixels.y - pixels.y; //opposite
            var dx = origPixels.x - pixels.x; // adjacent
            var ratio = dy / dx;
            var angle = Math.atan2(dy, dx);
            
            $('#compassArrow' + id).show().css({
                transform: 'rotate(' + angle + 'rad)',
                "-webkit-transform": 'rotate(' + angle + 'rad)',
            });
            
            if (dx > 0) {
                $('#compass' + id).addClass('labelLeft');
            }
        } else {
            $('#compassArrow' + id).hide();
            $('#compass' + id).removeClass('labelLeft');
        }
    }

    realtime.prototype.limitPixelsToScreen = function (pixels) {
        var self = this;
        var socket = this.socket;

        var xLimit, yLimit;
        var xMax=this.mapView.$parent.width();
        var yMax=this.mapView.$parent.height();
        var compassDiameter=56;
        var compassArrowSize=24;
        
        xLimit = Math.max(0 + compassArrowSize, pixels.x);
        xLimit = Math.min(xLimit, xMax - compassDiameter);
        yLimit = Math.max(0 + compassArrowSize, pixels.y);
        yLimit = Math.min(yLimit, yMax - compassDiameter);
        
        return {x:xLimit,y:yLimit};
    }

    realtime.prototype.sendCoords = function (coords) {
        var self = this;
        var socket = this.socket;

        var map = this.mapView.currentMap;
        var mapper = this.mapView.currentMapper;

        if (self.status && map.authorizeToEdit(mapper) && socket) {
            var update = {
                usercoords: coords,
                userid: this.mapView.currentMapper.id,
                mapid: this.mapView.currentMap.id
            };
            socket.emit('updateMapperCoords', update);
        }
    }

    realtime.prototype.sendTopicDrag = function (positions) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap && self.status) {
            positions.mapid = this.mapView.currentMap.id;
            socket.emit('topicDrag', positions);
        }
    }

    realtime.prototype.topicDrag = function (positions) {
        var self = this;
        var socket = self.socket;

        var topic;
        var node;

        if (this.mapView.currentMap && self.status) {
            for (var key in positions) {
                topic = this.mapView.Topics.get(key);
                if (topic) node = topic.get('node');
                if (node) node.pos.setc(positions[key].x, positions[key].y);
            } //for
            this.mapView.Visualize.mGraph.plot();
        }
    }

    realtime.prototype.sendTopicChange = function (topic) {
        var self = this;
        var socket = self.socket;

        var data = {
            topicId: topic.id
        }

        socket.emit('topicChangeFromClient', data);
    }

    realtime.prototype.topicChange = function (data) {
        var topic = this.mapView.Topics.get(data.topicId);
        if (topic) {
            var node = topic.get('node');
            topic.fetch({
                success: function (model) {
                    model.set({ node: node });
                    model.trigger('changeByOther');
                }
            });
        }
    }

    realtime.prototype.sendSynapseChange = function (synapse) {
        var self = this;
        var socket = self.socket;

        var data = {
            synapseId: synapse.id
        }

        socket.emit('synapseChangeFromClient', data);
    }

    realtime.prototype.synapseChange = function (data) {
        var synapse = this.mapView.Synapses.get(data.synapseId);
        if (synapse) {
            // edge reset necessary because fetch causes model reset
            var edge = synapse.get('edge');
            synapse.fetch({
                success: function (model) {
                    model.set({ edge: edge });
                    model.trigger('changeByOther');
                }
            });
        }
    }

    realtime.prototype.sendMapChange = function (map) {
        var self = this;
        var socket = self.socket;

        var data = {
            mapId: map.id
        }

        socket.emit('mapChangeFromClient', data);
    }

    realtime.prototype.mapChange = function (data) {
        var map = this.mapView.currentMap;
        var isActiveMap = map && data.mapId === map.id;
        if (isActiveMap) {
            var permBefore = map.get('permission');
            var idBefore = map.id;
            map.fetch({
                success: function (model, response) {

                    var idNow = model.id;
                    var permNow = model.get('permission');
                    if (idNow !== idBefore) {
                        this.mapView.Map.leavePrivateMap(); // this means the map has been changed to private
                    }
                    else if (permNow === 'public' && permBefore === 'commons') {
                        this.mapView.Map.commonsToPublic();
                    }
                    else if (permNow === 'commons' && permBefore === 'public') {
                        this.mapView.Map.publicToCommons();
                    }
                    else {
                        model.fetchContained();
                        model.trigger('changeByOther');
                    }
                }
            });
        }
    }

    // newTopic
    realtime.prototype.sendNewTopic = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap && self.status) {
            data.mapperid = this.mapView.currentMapper.id;
            data.mapid = this.mapView.currentMap.id;
            socket.emit('newTopic', data);
        }
    }

    realtime.prototype.newTopic = function (data) {
        var topic, mapping, mapper, mapperCallback, cancel;

        var self = this;
        var socket = self.socket;

        if (!self.status) return;

        function test() {
            if (topic && mapping && mapper) {
                this.mapView.Topic.renderTopic(mapping, topic, false, false);
            }
            else if (!cancel) {
                setTimeout(test, 10);
            }
        }

        mapper = this.mapView.Mappers.get(data.mapperid);
        if (mapper === undefined) {
            mapperCallback = function (m) {
                this.mapView.Mappers.add(m);
                mapper = m;
            };
            this.mapView.Mapper.get(data.mapperid, mapperCallback);
        }
        $.ajax({
            url: "/topics/" + data.topicid + ".json",
            success: function (response) {
                this.mapView.Topics.add(response);
                topic = this.mapView.Topics.get(response.id);
            },
            error: function () {
                cancel = true;
            }
        });
        $.ajax({
            url: "/mappings/" + data.mappingid + ".json",
            success: function (response) {
                this.mapView.Mappings.add(response);
                mapping = this.mapView.Mappings.get(response.id);
            },
            error: function () {
                cancel = true;
            }
        });

        test();
    }
    
    // removeTopic
    realtime.prototype.sendDeleteTopic = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap) {
            socket.emit('deleteTopicFromClient', data);
        }
    }
    
    // removeTopic
    realtime.prototype.sendRemoveTopic = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap) {
            data.mapid = this.mapView.currentMap.id;
            socket.emit('removeTopic', data);
        }
    }

    realtime.prototype.removeTopic = function (data) {
        var self = this;
        var socket = self.socket;

        if (!self.status) return;

        var topic = this.mapView.Topics.get(data.topicid);
        if (topic) {
            var node = topic.get('node');
            var mapping = topic.getMapping();
            this.mapView.Control.hideNode(node.id);
            this.mapView.Topics.remove(topic);
            this.mapView.Mappings.remove(mapping);
        }
    }
    
    // newSynapse
    realtime.prototype.sendNewSynapse = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap) {
            data.mapperid = this.mapView.currentMapper.id;
            data.mapid = this.mapView.currentMap.id;
            socket.emit('newSynapse', data);
        }
    }

    realtime.prototype.newSynapse = function (data) {
        var topic1, topic2, node1, node2, synapse, mapping, cancel;

        var self = this;
        var socket = self.socket;

        if (!self.status) return;

        function test() {
            if (synapse && mapping && mapper) {
                topic1 = synapse.getTopic1();
                node1 = topic1.get('node');
                topic2 = synapse.getTopic2();
                node2 = topic2.get('node');

                this.mapView.Synapse.renderSynapse(mapping, synapse, node1, node2, false);
            }
            else if (!cancel) {
                setTimeout(test, 10);
            }
        }

        mapper = this.mapView.Mappers.get(data.mapperid);
        if (mapper === undefined) {
            mapperCallback = function (m) {
                this.mapView.Mappers.add(m);
                mapper = m;
            };
            this.mapView.Mapper.get(data.mapperid, mapperCallback);
        }
        $.ajax({
            url: "/synapses/" + data.synapseid + ".json",
            success: function (response) {
                this.mapView.Synapses.add(response);
                synapse = this.mapView.Synapses.get(response.id);
            },
            error: function () {
                cancel = true;
            }
        });
        $.ajax({
            url: "/mappings/" + data.mappingid + ".json",
            success: function (response) {
                this.mapView.Mappings.add(response);
                mapping = this.mapView.Mappings.get(response.id);
            },
            error: function () {
                cancel = true;
            }
        });
        test();
    }

    // deleteSynapse
    realtime.prototype.sendDeleteSynapse = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap) {
            data.mapid = this.mapView.currentMap.id;
            socket.emit('deleteSynapseFromClient', data);
        }
    }

    // removeSynapse
    realtime.prototype.sendRemoveSynapse = function (data) {
        var self = this;
        var socket = self.socket;

        if (this.mapView.currentMap) {
            data.mapid = this.mapView.currentMap.id;
            socket.emit('removeSynapse', data);
        }
    }

    realtime.prototype.removeSynapse = function (data) {
        var self = this;
        var socket = self.socket;

        if (!self.status) return;

        var synapse = this.mapView.Synapses.get(data.synapseid);
        if (synapse) {
            var edge = synapse.get('edge');
            var mapping = synapse.getMapping();
            if (edge.getData("mappings").length - 1 === 0) {
                this.mapView.Control.hideEdge(edge);
            }
            
            var index = _.indexOf(edge.getData("synapses"), synapse);
            edge.getData("mappings").splice(index, 1);
            edge.getData("synapses").splice(index, 1);
            if (edge.getData("displayIndex")) {
                delete edge.data.$displayIndex;
            }
            this.mapView.Synapses.remove(synapse);
            this.mapView.Mappings.remove(mapping);
        }
    }

    return realtime;

}(jQuery));
