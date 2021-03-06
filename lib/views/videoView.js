if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.VideoView = (function($) {

    var Private = {
        cancelClick: function() {
            this.mouseIsDown = false;

            if (this.hasMoved) {
                
            }

            $(document).trigger(Mapmaker.VideoView.events.dragEnd);
        }
    };

    var Handlers = {
        mousedown: function(event) {
            this.mouseIsDown = true;
            this.hasMoved = false;
            this.mouseDownOffset = {
                x: event.offsetX,
                y: event.offsetY
            };

            $(document).trigger(Mapmaker.VideoView.events.mousedown);
        },
        mouseup: function(event) {
            $(document).trigger(Mapmaker.VideoView.events.mouseup, [this]);

            var storedTime = this.lastClick;
            var now = Date.now();
            this.lastClick = now;

            if (now - storedTime < this.view.config.DOUBLE_CLICK_TOLERANCE) {
                $(document).trigger(Mapmaker.VideoView.events.doubleClick, [this]);
            }
        },
        mousemove: function(event) {
            var
              offset = this.view.$parent.offset();

            if (this.mouseIsDown) {
                if (!this.hasMoved) this.hasMoved = true;
                this.$container.css({
                    top: event.pageY - offset.top - this.mouseDownOffset.y,
                    left: event.pageX - offset.left - this.mouseDownOffset.x
                });
            }
        },
        audioControlClick: function() {
            if (this.audioStatus) {
                this.$audioControl.css({
                    'text-decoration': 'line-through'
                });
                // mute it
            } else {
                this.$audioControl.css({
                    'text-decoration': 'none'
                });
                // unmute it
            }
            this.audioStatus = !this.audioStatus;
        },
        videoControlClick: function() {
            if (this.videoStatus) {
                this.$videoControl.css({
                    'text-decoration': 'line-through'
                });
                // change the video feed to an avatar
            } else {
                this.$videoControl.css({
                    'text-decoration': 'none'
                });
                // change the avatar to the video feed
            }
            this.videoStatus = !this.videoStatus;
        }
    };

    var videoView = function(video, view, id, isMyself) {
        var self = this;
        this.view = view; // mapView
        this.video = video;
        this.id = id;

        this.mouseIsDown = false;
        this.mouseDownOffset = { x: 0, y: 0 };
        this.lastClick = null;
        this.hasMoved = false;

        this.audioStatus = true;
        this.videoStatus = true;

        this.$container = $('<div></div>');
        this.$container.addClass('collaborator-video' + (isMyself ? ' my-video' : ''));
        this.$container.attr('id', 'container_' + id);
        this.$container.append(this.video);

        this.$container.on('mousedown', function (event) {
            Handlers.mousedown.call(self, event);
        });
        this.view.$parent.on('mouseup.video' + this.id, function (event) {
            Handlers.mouseup.call(self, event);
            Private.cancelClick.call(self);
        });
        this.view.$parent.on('mousemove.video' + this.id, function (event) {
            Handlers.mousemove.call(self, event);
        });

        this.$audioControl = $('<div class="video-audio">a</div>');
        this.$videoControl = $('<div class="video-video">v</div>');

        this.$audioControl.on('click', function () {
            Handlers.audioControlClick.call(self);
        });

        this.$videoControl.on('click', function () {
            Handlers.videoControlClick.call(self);
        });

        this.$container.append(this.$audioControl);
        this.$container.append(this.$videoControl);

        // suppress contextmenu
        this.video.oncontextmenu = function () { return false; };
    };

    videoView.prototype.remove = function () {
        this.$container.off();
        this.view.$parent.off('.video' + this.id);
        this.$container.remove();
    }

    return videoView;
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.VideoView.events = {
    mousedown: "Mapmaker:VideoView:mousedown",
    mouseup: "Mapmaker:VideoView:mouseup",
    doubleClick: "Mapmaker:VideoView:doubleClick",
    dragEnd: "Mapmaker:VideoView:dragEnd",
};