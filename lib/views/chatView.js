if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.ChatView = (function($) {

    var Private = {
        addMessage: function(message) {
            var m = _.clone(message.attributes);
            m.timestamp = new Date(m.timestamp);
            m.timestamp = m.timestamp.getDate() + '/' + (m.timestamp.getMonth() + 1);
            var html = this.messageTemplate.render(m);
            this.$messages.append(html);
        },
        initialMessages: function() {
            var messages = this.messages.models;
            for (var i = 0; i < messages.length; i++) {
                Private.addMessage.call(this, messages[i]);
            }
        },
        handleInputMessage: function() {
            var message = {
                message: this.$messageInput.val(),
                timestamp: Date.now(),
                user: this.mapper.get('name')
            };
            this.add(message);
            this.$messageInput.val('');
            $(document).trigger(Mapmaker.ChatView.events.message, [message]);
        }
    };

    var Handlers = {
        buttonClick: function() {
            if (this.isOpen) this.close();
            else this.open();
            this.isOpen = !this.isOpen;
        },
        keyUp: function(event) {
            switch(event.which) {
                case 13: // enter
                  Private.handleInputMessage.call(this);
                  break;
            }
        }
    };

    var chatView = function(view, messages, mapper) {
        var self = this;
        this.view = view; // mapView
        this.mapper = mapper;
        this.messages = messages; // backbone collection
        // add the event listener so that when
        // the realtime module adds messages to the collection
        // from other mappers, it will update the UI
        this.messages.on('add', function (message) {
            Private.addMessage.call(self, message);
        });

        this.isOpen = true;

        var html = document.getElementById("messageTemplate").innerHTML;
        this.messageTemplate = Hogan.compile(html);
        
        this.$button = $('<div class="chat-button"></div>');
        this.$messageInput = $('<textarea placeholder="Send a message..." class="chat-input"></textarea>');
        this.$messages = $('<div class="chat-messages"></div>');

        this.$button.on('click', function () {
            Handlers.buttonClick.call(self);
        });
        this.$messageInput.on('keyup', function (event) {
            Handlers.keyUp.call(self, event);
        });

        this.$container = $('<div class="chat-box"></div>');
        this.$container.append(this.$messageInput);
        this.$container.append(this.$button);
        this.$container.append(this.$messages);

        this.view.$parent.append(this.$container);

        Private.initialMessages.call(this);
    };

    chatView.prototype.add = function (message) {
        this.messages.add(message);
    }

    chatView.prototype.open = function () {
        this.$container.css({
            right: '0'
        });
    }

    chatView.prototype.close = function () {
        this.$container.css({
            right: '-300px'
        });
    }

    chatView.prototype.remove = function () {
        this.$button.off();
        this.$container.remove();
    }

    return chatView;
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.ChatView.events = {
    message: 'Mapmaker:ChatView:message'
};