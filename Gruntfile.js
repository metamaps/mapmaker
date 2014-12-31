/*global module:false*/
module.exports = function(grunt) {

	grunt.initConfig({});
	require('load-grunt-config')(grunt, {
		pkg: grunt.file.readJSON('package.json'),
		banner: '/* metamaps 2014 */\n'
	});
};
