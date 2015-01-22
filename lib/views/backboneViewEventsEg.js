var newTopicView = function() {
    this.events = {
      "dblclick"                : "open",
      "click .icon.doc"         : "select",
      "contextmenu .icon.doc"   : "showMenu",
      "click .mapCountIcon"     : "toggle",
      "click .title"            : "hide",
      "mouseover .title .date"  : "showTooltip"
    };