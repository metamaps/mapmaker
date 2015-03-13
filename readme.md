Licensed under an AGPL open source licence

# Mapmaker JS Library #

SPEC
- a global object ```Mapmaker``` which can be used to generate a ```mapView``` from a ```map```
- a ```mapView``` includes
  - INPUTS: ability to intake JSON for a ```map```, ```metacodeSet```'s, and ```metacodes```
  - PERSISTING: can output JSON, via Backbone models ```SAVE```, for ```topic```, ```synapse```, ```map```, and ```mapping```
  - topic cards, used to view details of, and edit, topics
  - synapse cards, used to view details of, and edit, synapses
  - map Info box, used to view details of, and edit, the map
  - a graph viz / editing tool
  - emit messages that should be displayed via a UI, as 'toast' messages
  - TRANSIENT: realtime collaboration on the graph viz / editing tool via websockets
  - TRANSIENT: chat functionality
  - TRANSIENT: multi- person video collaboration via WebRTC
  

## End Goal API Example ##
```
map = ...;
canvasEl = document.getElementById("mapCanvas");
config = {};
maker = Mapmaker.buildMaker.create(canvasEl, config, map);

maker.exportImage();
maker.save();
```

## GETTING SET UP TO DEV ##

To get this going::

clone this directory, enter the directory
```
cd mapmaker
```

Install node v0.10.35 via the website http://nodejs.org/

or via cmd line
```
sudo apt-get install nodejs -y
sudo apt-get install npm -y
ln -fs /usr/bin/nodejs /usr/bin/node
```

Install bower for front-end dependencies, grunt for a local server
```
npm install -g bower grunt-cli
```

Actually download the front-end, and server dependencies, and move some of them (grunt init)
```
npm install && bower install && grunt init
```

Run the development servers
```
grunt serveReload
```

## Ideas for API of sudmodules ##

#### mapView ####
- ACCEPTS: ```map```, ```config```, ```$parent```

#### TopicCard ####
- ACCEPTS: ```mapView```, ```topic```
- Public Api
    - show
    - hide

#### SynapseCard ####
- ACCEPTS: ```mapView```, ```synapse```
- Public Api
    - show
    - hide

#### MapInfoBox ####
- ACCEPTS: ```mapView```, ```map```
- Public Api
    - show
    - hide
