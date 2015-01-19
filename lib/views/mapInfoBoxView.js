if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.MapInfoBoxView = (function($) {

	var mapInfoBoxView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "mapInfoBoxView";

		var html = document.getElementById("mapInfoBoxTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(mapInfoBoxView.prototype, Mapmaker.Mixins.Visibility);

	mapInfoBoxView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	mapInfoBoxView.prototype.render = function() {
		this.$el.html(this.template.render(this.model.attributes));
		return this;
	};

	return Backbone.View.extend(new mapInfoBoxView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.MapInfoBoxView.events = {
	
};



Mapmaker.InfoBox = {
    isOpen: false,
    changing: false,
    selectingPermission: false,
    changePermissionText: "<div class='tooltips'>As the creator, you can change the permission of this map, but the permissions of the topics and synapses on it must be changed independently.</div>",
    nameHTML: '<span class="best_in_place best_in_place_name" id="best_in_place_map_{{id}}_name" data-url="/maps/{{id}}" data-object="map" data-attribute="name" data-type="textarea" data-activator="#mapInfoName">{{name}}</span>',
    descHTML: '<span class="best_in_place best_in_place_desc" id="best_in_place_map_{{id}}_desc" data-url="/maps/{{id}}" data-object="map" data-attribute="desc" data-nil="Click to add description..." data-type="textarea" data-activator="#mapInfoDesc">{{desc}}</span>',
    init: function () {
        var self = Mapmaker.Map.InfoBox;

        $('.mapInfoIcon').click(self.toggleBox);
        $('.mapInfoBox').click(function(event){ 
            event.stopPropagation();
        });
        $('body').click(self.close);

        self.attachEventListeners();

        self.generateBoxHTML = Hogan.compile($('#mapInfoBoxTemplate').html());
    },
    toggleBox: function (event) {
        var self = Mapmaker.Map.InfoBox;

        if (self.isOpen) self.close();
        else self.open();

        event.stopPropagation();
    },
    open: function () {
        var self = Mapmaker.Map.InfoBox;
        $('.mapInfoIcon div').addClass('hide');
        if (!self.isOpen && !self.changing) {
            self.changing = true;
            $('.mapInfoBox').fadeIn(200, function () {
                self.changing = false;
                self.isOpen = true;
            });
        }
    },
    close: function () {
        var self = Mapmaker.Map.InfoBox;

        $('.mapInfoIcon div').removeClass('hide');
        if (!self.changing) {
            self.changing = true;
            $('.mapInfoBox').fadeOut(200, function () {
                self.changing = false;
                self.isOpen = false;
                self.hidePermissionSelect();
                $('.mapContributors .tip').hide();
            });
        }
    },
    load: function () {
        var self = Mapmaker.Map.InfoBox;

        var map = Mapmaker.Active.Map;

        var obj = map.pick("permission","contributor_count","topic_count","synapse_count","created_at","updated_at");

        var isCreator = map.authorizePermissionChange(Mapmaker.Active.Mapper);
        var canEdit = map.authorizeToEdit(Mapmaker.Active.Mapper);
        var shareable = map.get('permission') !== 'private';

        obj["name"] = canEdit ? Hogan.compile(self.nameHTML).render({id: map.id, name: map.get("name")}) : map.get("name");
        obj["desc"] = canEdit ? Hogan.compile(self.descHTML).render({id: map.id, desc: map.get("desc")}) : map.get("desc");
        obj["map_creator_tip"] = isCreator ? self.changePermissionText : "";
        obj["contributors_class"] = Mapmaker.Mappers.length > 1 ? "multiple" : "";
        obj["contributors_class"] += Mapmaker.Mappers.length === 2 ? " mTwo" : "";
        obj["contributor_image"] = Mapmaker.Mappers.length > 0 ? Mapmaker.Mappers.models[0].get("image") : "/assets/user.png";
        obj["contributor_list"] = self.createContributorList();
        obj["user_name"] = isCreator ? "You" : map.get("user_name");

        var classes = isCreator ? "yourMap" : "";
        classes += canEdit ? " canEdit" : "";
        classes += shareable ? " shareable" : "";
        $(".mapInfoBox").removeClass("shareable yourMap canEdit")
            .addClass(classes)
            .html(self.generateBoxHTML.render(obj));

        self.attachEventListeners();
    },
    attachEventListeners: function () {
        var self = Mapmaker.Map.InfoBox;

        $('.mapInfoBox.canEdit .best_in_place').best_in_place();

        // because anyone who can edit the map can change the map title
        var bipName = $('.mapInfoBox .best_in_place_name');
        bipName.unbind("best_in_place:activate").bind("best_in_place:activate", function () {
            var $el = bipName.find('textarea');
            var el = $el[0];

            $el.attr('maxlength', '140');

            $('.mapInfoName').append('<div class="nameCounter forMap"></div>');

            var callback = function (data) {
                $('.nameCounter.forMap').html(data.all + '/140');
            };
            Countable.live(el, callback);
        });
        bipName.unbind("best_in_place:deactivate").bind("best_in_place:deactivate", function () {
            $('.nameCounter.forMap').remove();
        });

        $('.mapInfoName .best_in_place_name').unbind("ajax:success").bind("ajax:success", function () {
            var name = $(this).html();
            Mapmaker.Active.Map.set('name', name);
            Mapmaker.Active.Map.trigger('saved');
        });

        $('.mapInfoDesc .best_in_place_desc').unbind("ajax:success").bind("ajax:success", function () {
            var desc = $(this).html();
            Mapmaker.Active.Map.set('desc', desc);
            Mapmaker.Active.Map.trigger('saved');
        });

        $('.yourMap .mapPermission').unbind().click(self.onPermissionClick);
        // .yourMap in the unbind/bind is just a namespace for the events
        // not a reference to the class .yourMap on the .mapInfoBox
        $('.mapInfoBox.yourMap').unbind('.yourMap').bind('click.yourMap', self.hidePermissionSelect);

        $('.yourMap .mapInfoDelete').unbind().click(self.deleteActiveMap);

        $('.mapContributors span, #mapContribs').unbind().click(function(event){
            $('.mapContributors .tip').toggle();
            event.stopPropagation();
        });
        $('.mapContributors .tip').unbind().click(function(event){
            event.stopPropagation();
        });
        $('.mapContributors .tip li a').click(Mapmaker.Router.intercept);

        $('.mapInfoBox').unbind('.hideTip').bind('click.hideTip', function(){
            $('.mapContributors .tip').hide();
        });
    },
    updateNameDescPerm: function(name, desc, perm) {
        $('.mapInfoName .best_in_place_name').html(name);
        $('.mapInfoDesc .best_in_place_desc').html(desc);
        $('.mapInfoBox .mapPermission').removeClass('commons public private').addClass(perm);
    },
    createContributorList: function () {
        var self = Mapmaker.Map.InfoBox;

        var string = ""; 
        console.log("hello!!")
        string += "<ul>";

        Mapmaker.Mappers.each(function(m){
            string += '<li><a href="/explore/mapper/' + m.get("id") + '">' + '<img class="rtUserImage" width="25" height="25" src="' + m.get("image") + '" />' + m.get("name") + '</a></li>';
        });
        
        string += "</ul>";
        console.log(string);
        return string;
    },
    updateNumbers: function () {
        var self = Mapmaker.Map.InfoBox;
        var mapper = Mapmaker.Active.Mapper;

        var contributors_class = "";
        if (Mapmaker.Mappers.length === 2) contributors_class = "multiple mTwo";
        else if (Mapmaker.Mappers.length > 2) contributors_class = "multiple";

        var contributors_image = "/assets/user.png";
        if (Mapmaker.Mappers.length > 0) {
            // get the first contributor and use their image
            contributors_image = Mapmaker.Mappers.models[0].get("image");
        }
        $('.mapContributors img').attr('src', contributors_image).removeClass('multiple mTwo').addClass(contributors_class);
        $('.mapContributors span').text(Mapmaker.Mappers.length)
        $('.mapContributors .tip').html(self.createContributorList());
        $('.mapTopics').text(Mapmaker.Topics.length);
        $('.mapSynapses').text(Mapmaker.Synapses.length);

        $('.mapEditedAt').html('<span>Last edited: </span>' + Mapmaker.Util.nowDateFormatted());
    },
    onPermissionClick: function (event) {
        var self = Mapmaker.Map.InfoBox;

        if (!self.selectingPermission) {
            self.selectingPermission = true;
            $(this).addClass('minimize'); // this line flips the drop down arrow to a pull up arrow
            if ($(this).hasClass('commons')) {
                $(this).append('<ul class="permissionSelect"><li class="public"></li><li class="private"></li></ul>');
            } else if ($(this).hasClass('public')) {
                $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="private"></li></ul>');
            } else if ($(this).hasClass('private')) {
                $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="public"></li></ul>');
            }
            $('.mapPermission .permissionSelect li').click(self.selectPermission);
            event.stopPropagation();
        }
    },
    hidePermissionSelect: function () {
        var self = Mapmaker.Map.InfoBox;

        self.selectingPermission = false;
        $('.mapPermission').removeClass('minimize'); // this line flips the pull up arrow to a drop down arrow
        $('.mapPermission .permissionSelect').remove();
    },
    selectPermission: function (event) {
        var self = Mapmaker.Map.InfoBox;

        self.selectingPermission = false;
        var permission = $(this).attr('class');
        var permBefore = Mapmaker.Active.Map.get('permission');
        Mapmaker.Active.Map.save({
            permission: permission
        });
        Mapmaker.Active.Map.updateMapWrapper();
        if (permBefore !== 'commons' && permission === 'commons') {
            Mapmaker.Realtime.setupSocket();
            Mapmaker.Realtime.turnOn();
        }
        else if (permBefore === 'commons' && permission === 'public') {
            Mapmaker.Realtime.turnOff(true); // true is to 'silence' 
            // the notification that would otherwise be sent
        }
        shareable = permission === 'private' ? '' : 'shareable';
        $('.mapPermission').removeClass('commons public private minimize').addClass(permission);
        $('.mapPermission .permissionSelect').remove();
        $('.mapInfoBox').removeClass('shareable').addClass(shareable);
        event.stopPropagation();
    },
    deleteActiveMap: function () {
        var confirmString = 'Are you sure you want to delete this map? ';
        confirmString += 'This action is irreversible. It will not delete the topics and synapses on the map.';

        var doIt = confirm(confirmString);
        var map = Mapmaker.Active.Map;
        var mapper = Mapmaker.Active.Mapper;
        var authorized = map.authorizePermissionChange(mapper);

        if (doIt && authorized) {
            Mapmaker.Map.InfoBox.close();
            Mapmaker.Maps.Active.remove(map);
            Mapmaker.Maps.Featured.remove(map);
            Mapmaker.Maps.Mine.remove(map);
            map.destroy();
            Mapmaker.Router.home();
            Mapmaker.GlobalUI.notifyUser('Map eliminated!');
        }
        else if (!authorized) {
            alert('Hey now. We can\'t just go around willy nilly deleting other people\'s maps now can we? Run off and find something constructive to do, eh?');
        }
    }
};
