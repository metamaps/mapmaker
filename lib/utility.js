/* globals -Metamaps */
/* exported Metamaps */
var Metamaps = {};

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

Metamaps.Utility = (function() {
	var clone = function(sourceObj) {
		return JSON.parse(JSON.stringify(sourceObj));
	};

	var extendArrayIf = function(destArray, sourceArray) {
		var i;
		for (i = 0; i < sourceArray.length; i += 1) {
			if (Metamaps.Utility.isObject(sourceArray[i])) {
				if (destArray[i] === undefined) {
					destArray[i] = {};
				}
				extendIf(destArray[i], sourceArray[i]);
			} else if (Metamaps.Utility.isArray(sourceArray[i])) {
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
				if (Metamaps.Utility.isObject(sourceObj[key])) {
					if (destObj[key] === undefined) {
						destObj[key] = {};
					}
					Metamaps.Utility.extendIf(destObj[key], sourceObj[key]);
				} else if (Metamaps.Utility.isArray(sourceObj[key])) {
					if (destObj[key] === undefined) {
						destObj[key] = [];
					}
					//Test again, incase key existed but is not an Array
					//We'll loop through, and only extend undefined array values,
					//basically source[i] where i > dest.length
					if (Metamaps.Utility.isArray(destObj[key])) {
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
			!Metamaps.Utility.isArray(value));
	};

	return {
		clone: clone,
		extendIf: extendIf,
		extendArrayIf: extendArrayIf,
		isArray: isArray,
		isObject: isObject
	};
}());
