Mapmaker.SynapseCardView = (function($) {

	var synapseCardView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "synapseCardView";

		var html = document.getElementById("synapseCardTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(synapseCardView.prototype, Mapmaker.Mixins.Visibility);

	synapseCardView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	synapseCardView.prototype.render = function() {
		this.$el.html(this.template.render(this.model.attributes));
		return this;
	};

	return Backbone.View.extend(new synapseCardView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.SynapseCardView.events = {
	
};



Mapmaker.SynapseCard = {
    openSynapseCard: null,
    showCard: function (edge, e) {
        var self = Mapmaker.SynapseCard;

        //reset so we don't interfere with other edges, but first, save its x and y 
        var myX = $('#edit_synapse').css('left');
        var myY = $('#edit_synapse').css('top');
        $('#edit_synapse').remove();

        //so label is missing while editing
        Mapmaker.Control.deselectEdge(edge);

        var index = edge.getData("displayIndex") ? edge.getData("displayIndex") : 0;
        var synapse = edge.getData('synapses')[index]; // for now, just get the first synapse

        //create the wrapper around the form elements, including permissions
        //classes to make best_in_place happy
        var edit_div = document.createElement('div');
        edit_div.innerHTML = '<div id="editSynUpperBar"></div><div id="editSynLowerBar"></div>';
        edit_div.setAttribute('id', 'edit_synapse');
        if (synapse.authorizeToEdit(Mapmaker.Active.Mapper)) {
            edit_div.className = 'permission canEdit';
            edit_div.className += synapse.authorizePermissionChange(Mapmaker.Active.Mapper) ? ' yourEdge' : '';
        } else {
            edit_div.className = 'permission cannotEdit';
        }
        $('#wrapper').append(edit_div);

        self.populateShowCard(edge, synapse);

        //drop it in the right spot, activate it
        $('#edit_synapse').css('position', 'absolute');
        if (e) {
            $('#edit_synapse').css('left', e.clientX);
            $('#edit_synapse').css('top', e.clientY);
        } else {
            $('#edit_synapse').css('left', myX);
            $('#edit_synapse').css('top', myY);
        }
        //$('#edit_synapse_name').click(); //required in case name is empty
        //$('#edit_synapse_name input').focus();
        $('#edit_synapse').show();

        self.openSynapseCard = edge;
    },

    hideCard: function () {
        $('#edit_synapse').remove();
        Mapmaker.SynapseCard.openSynapseCard = null;
    },

    populateShowCard: function (edge, synapse) {
        var self = Mapmaker.SynapseCard;

        self.add_synapse_count(edge);
        self.add_desc_form(synapse);
        self.add_drop_down(edge, synapse);
        self.add_user_info(synapse);
        self.add_perms_form(synapse);
        self.add_direction_form(synapse);
    },
    add_synapse_count: function (edge) {
        var count = edge.getData("synapses").length;

        $('#editSynUpperBar').append('<div id="synapseCardCount">' + count + '</div>')
    },
    add_desc_form: function (synapse) {
        var data_nil = 'Click to add description.';

        // TODO make it so that this would work even in sandbox mode,
        // currently with Best_in_place it won't

        //desc editing form
        $('#editSynUpperBar').append('<div id="edit_synapse_desc"></div>');
        $('#edit_synapse_desc').attr('class', 'best_in_place best_in_place_desc');
        $('#edit_synapse_desc').attr('data-object', 'synapse');
        $('#edit_synapse_desc').attr('data-attribute', 'desc');
        $('#edit_synapse_desc').attr('data-type', 'textarea');
        $('#edit_synapse_desc').attr('data-nil', data_nil);
        $('#edit_synapse_desc').attr('data-url', '/synapses/' + synapse.id);
        $('#edit_synapse_desc').html(synapse.get("desc"));

        //if edge data is blank or just whitespace, populate it with data_nil
        if ($('#edit_synapse_desc').html().trim() == '') {
            if (synapse.authorizeToEdit(Mapmaker.Active.Mapper)) {
                $('#edit_synapse_desc').html(data_nil);
            }
            else {
                $('#edit_synapse_desc').html("(no description)");
            }
        }

        $('#edit_synapse_desc').bind("ajax:success", function () {
            var desc = $(this).html();
            if (desc == data_nil) {
                synapse.set("desc", '');
            } else {
                synapse.set("desc", desc);
            }
            synapse.trigger('saved');
            Mapmaker.Control.selectEdge(synapse.get('edge'));
            Mapmaker.Visualize.mGraph.plot();
        });
    },
    add_drop_down: function (edge, synapse) {
        var list, i, synapses, l, desc;

        synapses = edge.getData("synapses");
        l = synapses.length;

        if (l > 1) {
            // append the element that you click to show dropdown select
            $('#editSynUpperBar').append('<div id="dropdownSynapses"></div>');
            $('#dropdownSynapses').click(function(e){
                e.preventDefault();
                e.stopPropagation(); // stop it from immediately closing it again
                $('#switchSynapseList').toggle();
            });
            // hide the dropdown again if you click anywhere else on the synapse card
            $('#edit_synapse').click(function(){
                $('#switchSynapseList').hide();
            });

            // generate the list of other synapses
            list = '<ul id="switchSynapseList">';
            for (i = 0; i < l; i++) {
                if (synapses[i] !== synapse) { // don't add the current one to the list
                    desc = synapses[i].get('desc');
                    desc = desc === "" || desc === null ? "(no description)" : desc;
                    list += '<li data-synapse-index="' + i + '">' + desc + '</li>';
                }
            }
            list += '</ul>'
            // add the list of the other synapses
            $('#editSynLowerBar').append(list);

            // attach click listeners to list items that
            // will cause it to switch the displayed synapse 
            // when you click it
            $('#switchSynapseList li').click(function(e){
                e.stopPropagation();
                var index = parseInt($(this).attr('data-synapse-index'));
                edge.setData('displayIndex', index);
                Mapmaker.Visualize.mGraph.plot();
                Mapmaker.SynapseCard.showCard(edge, false);
            });
        }
    },
    add_user_info: function (synapse) {
        var u = '<div id="edgeUser" class="hoverForTip">';
        u += '<a href="/explore/mapper/' + synapse.get("user_id") + '"> <img src="" width="24" height="24" /></a>'
        u += '<div class="tip">' + synapse.get("user_name") + '</div></div>';
        $('#editSynLowerBar').append(u);

        // get mapper image
        var setMapperImage = function (mapper) {
            $('#edgeUser img').attr('src', mapper.get('image'));
        };
        Mapmaker.Mapper.get(synapse.get('user_id'), setMapperImage);
    },

    add_perms_form: function (synapse) {
        //permissions - if owner, also allow permission editing
        $('#editSynLowerBar').append('<div class="mapPerm ' + synapse.get("permission").substring(0, 2) + '"></div>');

        // ability to change permission
        var selectingPermission = false;
        var permissionLiClick = function (event) {
            selectingPermission = false;
            var permission = $(this).attr('class');
            synapse.save({
                permission: permission
            });
            $('#edit_synapse .mapPerm').removeClass('co pu pr minimize').addClass(permission.substring(0, 2));
            $('#edit_synapse .permissionSelect').remove();
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
                $('#edit_synapse .permissionSelect li').click(permissionLiClick);
                event.stopPropagation();
            }
        };

        var hidePermissionSelect = function () {
            selectingPermission = false;
            $('#edit_synapse.yourEdge .mapPerm').removeClass('minimize'); // this line flips the pull up arrow to a drop down arrow
            $('#edit_synapse .permissionSelect').remove();
        };

        if (synapse.authorizePermissionChange(Mapmaker.Active.Mapper)) {
            $('#edit_synapse.yourEdge .mapPerm').click(openPermissionSelect);
            $('#edit_synapse').click(hidePermissionSelect);
        }
    }, //add_perms_form

    add_direction_form: function (synapse) {
        //directionality checkboxes
        $('#editSynLowerBar').append('<div id="edit_synapse_left"></div>');
        $('#editSynLowerBar').append('<div id="edit_synapse_right"></div>');

        var edge = synapse.get('edge');

        //determine which node is to the left and the right
        //if directly in a line, top is left
        if (edge.nodeFrom.pos.x < edge.nodeTo.pos.x ||
            edge.nodeFrom.pos.x == edge.nodeTo.pos.x &&
            edge.nodeFrom.pos.y < edge.nodeTo.pos.y) {
            var left = edge.nodeTo.getData("topic");
            var right = edge.nodeFrom.getData("topic");
        } else {
            var left = edge.nodeFrom.getData("topic");
            var right = edge.nodeTo.getData("topic");
        }

        /*
         * One node is actually on the left onscreen. Call it left, & the other right.
         * If category is from-to, and that node is first, check the 'right' checkbox.
         * Else check the 'left' checkbox since the arrow is incoming.
         */

        var directionCat = synapse.get('category'); //both, none, from-to
        if (directionCat == 'from-to') {
            var from_to = [synapse.get("node1_id"), synapse.get("node2_id")];
            if (from_to[0] == left.id) {
                //check left checkbox
                $('#edit_synapse_left').addClass('checked');
            } else {
                //check right checkbox
                $('#edit_synapse_right').addClass('checked');
            }
        } else if (directionCat == 'both') {
            //check both checkboxes
            $('#edit_synapse_left').addClass('checked');
            $('#edit_synapse_right').addClass('checked');
        }

        if (synapse.authorizeToEdit(Mapmaker.Active.Mapper)) {
            $('#edit_synapse_left, #edit_synapse_right').click(function () {
                
                $(this).toggleClass('checked');

                var leftChecked = $('#edit_synapse_left').is('.checked');
                var rightChecked = $('#edit_synapse_right').is('.checked');

                var dir = synapse.getDirection();
                var dirCat = 'none';
                if (leftChecked && rightChecked) {
                    dirCat = 'both';
                } else if (!leftChecked && rightChecked) {
                    dirCat = 'from-to';
                    dir = [right.id, left.id];
                } else if (leftChecked && !rightChecked) {
                    dirCat = 'from-to';
                    dir = [left.id, right.id];
                }

                synapse.save({
                    category: dirCat,
                    node1_id: dir[0],
                    node2_id: dir[1]
                });
                Mapmaker.Visualize.mGraph.plot();
            });
        } // if
    } //add_direction_form
};
