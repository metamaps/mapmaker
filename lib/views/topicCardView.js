/* change in api

showCard - show
hideCard - hide


*/


// TODO: handle auth using bitwise operators

Mapmaker.TopicCardView = (function($) {

  // functions called in no specific context with the intent of returning something
  var Returns = {
    buildObjectForTemplate: function (topic) {
        var
          nodeValues = {},
          authorized = true, //TODO: switch to topic.authorizeToEdit();
          desc_nil = 'Click to add description...',
          inmapsAr = topic.get("inmaps"),
          inmapsLinks = topic.get("inmapsLinks"),
          url;

        if (!authorized) {
            
        } else {
            
        }

        nodeValues.attachmentsHidden = '';
        if (topic.get('link') && topic.get('link')!== '') {
            nodeValues.embeds = '<a href="' + topic.get('link') + '" class="embedlyLink" target="_blank" data-card-chrome="0" data-card-description="0">';
            nodeValues.embeds += topic.get('link');
            nodeValues.embeds += '</a><div class="embedlyLinkLoader"></div>';
            nodeValues.attachmentsHidden = 'hidden';
            nodeValues.hasAttachment = "hasAttachment";
        }
        else {
            nodeValues.embeds = '';
            nodeValues.hasAttachment = '';
        }

        if (authorized) {
            nodeValues.attachments = '<div class="addLink"><div class="addLinkIcon"></div>';
            nodeValues.attachments += '<div class="addLinkInput"><input placeholder="Enter or paste a link"></input>';
            nodeValues.attachments += '<div class="addLinkReset"></div></div></div>';
        } else {
            nodeValues.attachmentsHidden = 'hidden';
            nodeValues.attachments = '';
        }

        
        nodeValues.inmaps ='';
        if (inmapsAr.length < 6) {
            for (i = 0; i < inmapsAr.length; i++) {
                url = "/maps/" + inmapsLinks[i];
                nodeValues.inmaps += '<li><a href="' + url + '">'  + inmapsAr[i]+ '</a></li>';
            }
        }
        else {
            for (i = 0; i < 5; i++){
                var url = "/maps/" + inmapsLinks[i];
                nodeValues.inmaps += '<li><a href="' + url + '">' + inmapsAr[i] + '</a></li>';
            }
            extra = inmapsAr.length - 5;
            nodeValues.inmaps += '<li><span class="showMore">See ' + extra + ' more...</span></li>'
            for (i = 5; i < inmapsAr.length; i++){
                url = "/maps/" + inmapsLinks[i];
                nodeValues.inmaps += '<li class="hideExtra extraText"><a href="' + url + '">' + inmapsAr[i]+ '</a></li>';
            }
        }
        nodeValues.permission = topic.get("permission");
        nodeValues.mk_permission = topic.get("permission").substring(0, 2);
        nodeValues.map_count = topic.get("map_count").toString();
        nodeValues.synapse_count = topic.get("synapse_count").toString();
        nodeValues.id = topic.isNew() ? topic.cid : topic.id;
        nodeValues.metacode = 'Action'; // topic.getMetacode().get("name");
        nodeValues.metacode_class = 'mbg' + topic.get('metacode_id');
        nodeValues.imgsrc = '/img/bp_action.png'; // topic.getMetacode().get("icon");
        nodeValues.name = topic.get("name");
        nodeValues.userid = topic.get("user_id");
        nodeValues.username = topic.get("user_name");
        nodeValues.date = topic.getDate();
        // the code for this is stored in /views/main/_metacodeOptions.html.erb
        nodeValues.metacode_select = $('#metacodeOptions').html();
        nodeValues.desc_nil = desc_nil;
        nodeValues.desc = (topic.get("desc") == "" && authorized) ? desc_nil : topic.get("desc");
        return nodeValues;
    },
    validateLink: function (link) {

      // TODO: write this
      return true;
    }
  };


  // functions called with TopicCardView as it's 'this' context
  var Private = {
    linkChange: function () {
      var
        link = this.model.get('link');
        
      if (!Returns.validateLink(link)) Private.invalidLink.call(this);
      else if (link === '' || !link) Private.removeLink.call(this);
      else Private.addLink.call(this);
    },
    invalidLink: function () {
      $(document).trigger(Mapmaker.TopicCardView.events.invalidLink);
      Private.removeLink.call(this);
    },
    removeLink: function () {
      this.$('.embeds').empty().removeClass('nonEmbedlyLink');
      this.$('.addLinkInput input').val("");
      this.$('.attachments').show();
      this.$('.CardOnGraph').removeClass('hasAttachment');
    },
    addLink: function () {
      var 
        link = this.$('.addLinkInput input').val(),
        embedlyEl = $('<a/>', {
          class: 'embedlyLink',
          'data-card-chrome': '0',
          'data-card-description': '0',
          href: link
        }).html(link);
      this.$('.attachments').hide();
      this.$('.embeds').append(embedlyEl);
      Private.embedify.call(this);
    },
    embedify: function () {
      /*this.$('.embeds').append('<div id="embedlyLinkLoader"></div>');
      var loader = new CanvasLoader('embedlyLinkLoader');
      loader.setColor('#4fb5c0'); // default is '#000000'
      loader.setDiameter(28); // default is 40
      loader.setDensity(41); // default is 40
      loader.setRange(0.9); // default is 1.3
      loader.show(); // Hidden by default*/
      var e = embedly('card', this.$('.embedlyLink')[0]);
      /*if (!e) {
          self.handleInvalidLink();
      }*/
    },
    embedlyCardRendered: function (iframe) {

        //$('#embedlyLinkLoader').hide();

        // means that the embedly call returned 404 not found
        if (this.$('.embedlyLink')[0]) {
            this.$('.embedlyLink').css('display', 'block').fadeIn('fast');
            this.$('.embeds').addClass('nonEmbedlyLink');
        }

        this.$('.CardOnGraph').addClass('hasAttachment');

        // TODO: replace true with authorizedToEdit
        if (true) {
            this.$('.embeds').append('<div class="linkremove"></div>');
        }
    }
  };





	var topicCardView = function() {
		this.events = {
			'mouseenter .metacodeImage'  : 'showMetacodeTitle',
      'mouseleave .linkItem.icon'  : 'hideMetacodeTitle',
      'keyup .addLinkInput input'  : 'onLinkKeyup',
      'click .addLinkReset'        : 'resetLinkInput',
      'click .linkremove'          : 'removeLink'
		};

		this.className = 'topicCardView';

		var html = document.getElementById('topicCardTemplate').innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(topicCardView.prototype, Mapmaker.Mixins.Visibility);

	topicCardView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, 'mapView'));

    this.selectingMetacode = false;

		this.mapView.$parent.append(this.render().el);
	};

	topicCardView.prototype.render = function() {
    var
      obj = Returns.buildObjectForTemplate(this.model),
      link = this.model.get('link');

		this.$el.html(this.template.render(obj));

    // embedly 
    embedly('on', 'card.rendered', Private.embedlyCardRendered.bind(this));
    if (link && link !== '') Private.embedify.call(this);

    // listen for change events on this.model here
    this.model.on('change:link', Private.linkChange.bind(this));

		return this;
	};

  topicCardView.prototype.removeLink = function () {
      this.model.set('link', null);
      /*this.model.save({
          link: null
      });*/
  };

  topicCardView.prototype.showMetacodeTitle = function () {
    this.$('.icon').css('z-index', '4');
    this.$('.metacodeTitle').show();
  };

  topicCardView.prototype.hideMetacodeTitle = function () {
    if (!this.selectingMetacode) {
        this.$('.metacodeTitle').hide();
        this.$('.icon').css('z-index', '1');
    }
  };

  topicCardView.prototype.resetLinkInput = function () {
    this.$('.addLinkInput input').val("");
    this.$('.addLinkInput input').focus();
  };
    
  
  topicCardView.prototype.onLinkKeyup = function (e) {
    var
      url = '';

    // enter key
    if (e.which === 13) {
      url = this.$('.addLinkInput input').val();
      if (url.slice(0, 4) !== 'http') {
        url = 'http://' + url;
      }
      this.model.set('link', url);
    }
  };


	return Backbone.View.extend(new topicCardView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.TopicCardView.events = {
	invalidLink: 'Mapmaker:TopicCardView:invalidLink'
};





Mapmaker.TopicCard = {
    openTopicCard: null, //stores the topic that's currently open
    authorizedToEdit: false, // stores boolean for edit permission for open topic card
    init: function () {
        var self = Mapmaker.TopicCard;

        // initialize best_in_place editing
        $('.authenticated div.permission.canEdit .best_in_place').best_in_place();

        // initialize topic card draggability and resizability
        $('.showcard').draggable({
            handle: ".metacodeImage"
        });
    },
    bindShowCardListeners: function (topic) {
        var self = Mapmaker.TopicCard;
        var showCard = document.getElementById('showcard');

        var authorized = self.authorizedToEdit;

        // get mapper image
        var setMapperImage = function (mapper) {
            $('.contributorIcon').attr('src', mapper.get('image'));
        };
        Mapmaker.Mapper.get(topic.get('user_id'), setMapperImage);

        var metacodeLiClick = function () {
            selectingMetacode = false;
            var metacodeId = parseInt($(this).attr('data-id'));
            var metacode = Mapmaker.Metacodes.get(metacodeId);
            $('.CardOnGraph').find('.metacodeTitle').html(metacode.get('name'))
                .append('<div class="expandMetacodeSelect"></div>')
                .attr('class', 'metacodeTitle mbg' + metacode.id);
            $('.CardOnGraph').find('.metacodeImage').css('background-image', 'url(' + metacode.get('icon') + ')');
            topic.save({
                metacode_id: metacode.id
            });
            Mapmaker.Visualize.mGraph.plot();
            $('.metacodeSelect').hide().removeClass('onRightEdge onBottomEdge');
            $('.metacodeTitle').hide();
            $('.showcard .icon').css('z-index', '1');
        };

        var openMetacodeSelect = function (event) {
            var windowWidth;
            var showcardLeft;
            var TOPICCARD_WIDTH = 300;
            var METACODESELECT_WIDTH = 404;
            var distanceFromEdge;

            var MAX_METACODELIST_HEIGHT = 270;
            var windowHeight;
            var showcardTop;
            var topicTitleHeight;
            var distanceFromBottom;

            if (!selectingMetacode) {
                selectingMetacode = true;

                // this is to make sure the metacode 
                // select is accessible onscreen, when opened
                // while topic card is close to the right 
                // edge of the screen
                windowWidth = $(window).width();
                showcardLeft = parseInt($('.showcard').css('left'));
                distanceFromEdge = windowWidth - (showcardLeft + TOPICCARD_WIDTH);
                if (distanceFromEdge < METACODESELECT_WIDTH) {
                    $('.metacodeSelect').addClass('onRightEdge');
                }

                // this is to make sure the metacode 
                // select is accessible onscreen, when opened
                // while topic card is close to the bottom
                // edge of the screen
                windowHeight = $(window).height();
                showcardTop = parseInt($('.showcard').css('top'));
                topicTitleHeight = $('.showcard .title').height() + parseInt($('.showcard .title').css('padding-top')) + parseInt($('.showcard .title').css('padding-bottom'));
                heightOfSetList = $('.showcard .metacodeSelect').height();
                distanceFromBottom = windowHeight - (showcardTop + topicTitleHeight);
                if (distanceFromBottom < MAX_METACODELIST_HEIGHT) {
                    $('.metacodeSelect').addClass('onBottomEdge');
                }

                $('.metacodeSelect').show();
                event.stopPropagation();
            }
        };

        var hideMetacodeSelect = function () {
            selectingMetacode = false;
            $('.metacodeSelect').hide().removeClass('onRightEdge onBottomEdge');
            $('.metacodeTitle').hide();
            $('.showcard .icon').css('z-index', '1');
        };

        if (authorized) {
            $('.showcard .metacodeTitle').click(openMetacodeSelect);
            $('.showcard').click(hideMetacodeSelect);
            $('.metacodeSelect > ul > li').click(function (event){
                event.stopPropagation();
            });
            $('.metacodeSelect li li').click(metacodeLiClick);

            var bipName = $(showCard).find('.best_in_place_name');
            bipName.bind("best_in_place:activate", function () {
                var $el = bipName.find('textarea');
                var el = $el[0];

                $el.attr('maxlength', '140');

                $('.showcard .title').append('<div class="nameCounter forTopic"></div>');

                var callback = function (data) {
                    $('.nameCounter.forTopic').html(data.all + '/140');
                };
                Countable.live(el, callback);
            });
            bipName.bind("best_in_place:deactivate", function () {
                $('.nameCounter.forTopic').remove();
            });

            //bind best_in_place ajax callbacks
            bipName.bind("ajax:success", function () {
                var name = Mapmaker.Util.decodeEntities($(this).html());
                topic.set("name", name);
                topic.trigger('saved');
            });

            $(showCard).find('.best_in_place_desc').bind("ajax:success", function () {
                this.innerHTML = this.innerHTML.replace(/\r/g, '');
                var desc = $(this).html() === $(this).data('nil') ? "" : $(this).html();
                topic.set("desc", desc);
                topic.trigger('saved');
            });
        }


        var permissionLiClick = function (event) {
            selectingPermission = false;
            var permission = $(this).attr('class');
            topic.save({
                permission: permission
            });
            $('.showcard .mapPerm').removeClass('co pu pr minimize').addClass(permission.substring(0, 2));
            $('.showcard .permissionSelect').remove();
            event.stopPropagation();
        };

        var openPermissionSelect = function (event) {
            if (!selectingPermission) {
                selectingPermission = true;
                $(this).addClass('minimize'); // this line flips the drop down arrow to a pull up arrow
                if ($(this).hasClass('co')) {
                    $(this).append('<ul class="permissionSelect"><li class="public"></li><li class="private"></li></ul>');
                } else if ($(this).hasClass('pu')) {
                    $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="private"></li></ul>');
                } else if ($(this).hasClass('pr')) {
                    $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="public"></li></ul>');
                }
                $('.showcard .permissionSelect li').click(permissionLiClick);
                event.stopPropagation();
            }
        };

        var hidePermissionSelect = function () {
            selectingPermission = false;
            $('.showcard .yourTopic .mapPerm').removeClass('minimize'); // this line flips the pull up arrow to a drop down arrow
            $('.showcard .permissionSelect').remove();
        };
        // ability to change permission
        var selectingPermission = false;
        if (topic.authorizePermissionChange(Mapmaker.Active.Mapper)) {
            $('.showcard .yourTopic .mapPerm').click(openPermissionSelect);
            $('.showcard').click(hidePermissionSelect);
        }

        $('.links .mapCount').unbind().click(function(event){
            $('.mapCount .tip').toggle();
            $('.showcard .hoverTip').toggleClass('hide');
            event.stopPropagation();
        });
        $('.mapCount .tip').unbind().click(function(event){
            event.stopPropagation();
        });
        $('.showcard').unbind('.hideTip').bind('click.hideTip', function(){
            $('.mapCount .tip').hide();
            $('.showcard .hoverTip').removeClass('hide');
        });

        $('.mapCount .tip li a').click(Mapmaker.Router.intercept);

        var originalText = $('.showMore').html();
        $('.mapCount .tip .showMore').unbind().toggle(
            function(event){
                $('.extraText').toggleClass("hideExtra");
                $('.showMore').html('Show less...');
            },
            function(event){
                $('.extraText').toggleClass("hideExtra");
                $('.showMore').html(originalText);
            });

        $('.mapCount .tip showMore').unbind().click(function(event){
            event.stopPropagation();
        });
    },
    populateShowCard: function (topic) {
        var self = Mapmaker.TopicCard;

        var showCard = document.getElementById('showcard');

        $(showCard).find('.permission').remove();

        var topicForTemplate = self.buildObject(topic);
        var html = self.generateShowcardHTML.render(topicForTemplate);

        if (topic.authorizeToEdit(Mapmaker.Active.Mapper)) {
            var perm = document.createElement('div');

            var string = 'permission canEdit';
            if (topic.authorizePermissionChange(Mapmaker.Active.Mapper)) string += ' yourTopic';
            perm.className = string;
            perm.innerHTML = html;
            showCard.appendChild(perm);
        } else {
            var perm = document.createElement('div');
            perm.className = 'permission cannotEdit';
            perm.innerHTML = html;
            showCard.appendChild(perm);
        }

        Mapmaker.TopicCard.bindShowCardListeners(topic);
    }
};
