== Mapmaker JS Library == 

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

Install bower for front-end dependencies
```
npm install -g bower
```

Actually download the front-end, and server dependencies
```
npm install && bower install
```

Run the front end server
```
grunt serve
```
(You can also use ```grunt serveNoOpen``` to not open the chrome window every time)

Run the realtime server
```
node ./lib/server/server.js
```

currently, the only way to see your code changes as you develop, depending where they were: the server, or other code, both require killing the process and restarting... CTRL+C will kill either process. 

Licensed under an AGPL open source licence
