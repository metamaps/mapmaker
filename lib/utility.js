if (typeof Mapmaker === 'undefined') Mapmaker = {};

Mapmaker.Utility = (function() {
	
	// helper function to determine how many lines are needed
  // Line Splitter Function
  // copyright Stephen Chapman, 19th April 2006
  // you may copy this code but please keep the copyright notice as well
  var splitLine = function (st, n) {
      var b = '';
      var s = st ? st : '';
      while (s.length > n) {
          var c = s.substring(0, n);
          var d = c.lastIndexOf(' ');
          var e = c.lastIndexOf('\n');
          if (e != -1) d = e;
          if (d == -1) d = n;
          b += c.substring(0, d) + '\n';
          s = s.substring(d + 1);
      }
      return b + s;
  };

  var nowDateFormatted = function () {
      var date = new Date(Date.now());
      var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var year = date.getFullYear();

      return month + '/' + day + '/' + year;
  };

  var decodeEntities = function (desc) {
      var str, temp = document.createElement('p');
      temp.innerHTML = desc; //browser handles the topics
      str = temp.textContent || temp.innerText;
      temp = null; //delete the element;
      return str;
  }; //decodeEntities

  var getDistance = function (p1, p2) {
      return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
  };

  var coordsToPixels = function (coords, mapView) {
    return  {
      x: coords.x + (mapView.$parent.width() / 2) + mapView.translateX,
      y: coords.y + (mapView.$parent.height() / 2) + mapView.translateY
    };
  };

  var pixelsToCoords = function (pixels, mapView) {
    return {
        x: pixels.x - (mapView.$parent.width() / 2) - mapView.translateX,
        y: pixels.y - (mapView.$parent.height() / 2) - mapView.translateY,
    };
  };

  var getPastelColor = function () {
      var r = (Math.round(Math.random()* 127) + 127).toString(16);
      var g = (Math.round(Math.random()* 127) + 127).toString(16);
      var b = (Math.round(Math.random()* 127) + 127).toString(16);
      return Mapmaker.Utility.colorLuminance('#' + r + g + b, -0.4);
  };

  // darkens a hex value by 'lum' percentage
  var colorLuminance = function (hex, lum) {

      // validate hex string
      hex = String(hex).replace(/[^0-9a-f]/gi, '');
      if (hex.length < 6) {
          hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      }
      lum = lum || 0;

      // convert to decimal and change luminosity
      var rgb = "#", c, i;
      for (i = 0; i < 3; i++) {
          c = parseInt(hex.substr(i*2,2), 16);
          c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
          rgb += ("00"+c).substr(c.length);
      }

      return rgb;
  };

  var generateOptionsList = function (data) {
      var newlist = "";
      for (var i = 0; i < data.length; i++) {
          newlist = newlist + '<option value="' + data[i]['id'] + '">' + data[i]['1'][1] + '</option>';
      }
      return newlist;
  };

  var checkURLisImage = function (url) {
      // when the page reloads the following regular expression will be screwed up
      // please replace it with this one before you save: /*backslashhere*.(jpeg|jpg|gif|png)$/ 
      return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  };

  var checkURLisYoutubeVideo = function (url) {
      return (url.match(/^http:\/\/(?:www\.)?youtube.com\/watch\?(?=[^?]*v=\w+)(?:[^\s?]+)?$/) != null);
  };

	var clone = function(sourceObj) {
		return JSON.parse(JSON.stringify(sourceObj));
	};

	var extendArrayIf = function(destArray, sourceArray) {
		var i;
		for (i = 0; i < sourceArray.length; i += 1) {
			if (Mapmaker.Utility.isObject(sourceArray[i])) {
				if (destArray[i] === undefined) {
					destArray[i] = {};
				}
				extendIf(destArray[i], sourceArray[i]);
			} else if (Mapmaker.Utility.isArray(sourceArray[i])) {
				if (destArray[i] === undefined) {
					destArray[i] = [];
				}
				extendArrayIf(destArray[i], sourceArray[i]);
			} else if (destArray[i] === undefined) {
				destArray[i] = sourceArray[i];
			}
		}
	};

	var extendIf = function(destObj, sourceObj) {
		var key;
		for (key in sourceObj) {
			if (sourceObj.hasOwnProperty(key)) {
				if (Mapmaker.Utility.isObject(sourceObj[key])) {
					if (destObj[key] === undefined) {
						destObj[key] = {};
					}
					Mapmaker.Utility.extendIf(destObj[key], sourceObj[key]);
				} else if (Mapmaker.Utility.isArray(sourceObj[key])) {
					if (destObj[key] === undefined) {
						destObj[key] = [];
					}
					//Test again, incase key existed but is not an Array
					//We'll loop through, and only extend undefined array values,
					//basically source[i] where i > dest.length
					if (Mapmaker.Utility.isArray(destObj[key])) {
						extendArrayIf(destObj[key], sourceObj[key]);
					}
				} else if (destObj[key] === undefined) {
					destObj[key] = sourceObj[key];
				}
			}
		}
	};

	var isArray = function(value) {
		if ("isArray" in Array) {
			return Array.isArray(value);
		} else {
			return Object.prototype.toString.call(value) === "[object Array]";
		}
	};

	var isObject = function(value) {
		return (typeof value === "object" && value !== null &&
			!Mapmaker.Utility.isArray(value));
	};

	return {
		clone: clone,
		extendIf: extendIf,
		extendArrayIf: extendArrayIf,
		isArray: isArray,
		isObject: isObject,
		splitLine: splitLine,
		nowDateFormatted: nowDateFormatted,
		decodeEntities: decodeEntities,
		getDistance: getDistance,
		coordsToPixels: coordsToPixels,
		pixelsToCoords: pixelsToCoords,
		getPastelColor: getPastelColor,
		colorLuminance: colorLuminance,
		generateOptionsList: generateOptionsList,
		checkURLisImage: checkURLisImage,
		checkURLisYoutubeVideo: checkURLisYoutubeVideo
	};
	
}());
