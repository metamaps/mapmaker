To run the chat server on port 5002, do node server.js in this directory.

Then copy chat-client.css and chat-client.js into your client docroot ("serve/js" directory, in the mapmaker repository)

You'll need to insert a <div id="easyRTCWrapper"></div> element into your body somewhere for the chat-client.js to append its elements to.
