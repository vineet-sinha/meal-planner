'use strict';

/////////////////////////////////////////
// Setup
/////////////////////////////////////////

// enable logging of conversationEngine
require('debug').enable('warn:*,engine:*');

// initialize the engine - so that Violet does not launch the standalone server automatically
require('violet').server();

// load the voice app
const violet = require('./app.js').script;

// compile scripts & register intents
violet.registerIntents();

const platformsList = violet.platforms.platforms;

module.exports.violetDevHandler = async (event) => {
  return {
    statusCode: 200,
    body: platformsList[0]._app.schemas.askcli()
  };
};

// hook up with event handling
platformsList.forEach(p=>{
  module.exports[p.endpoint + 'Handler'] = async (event, context, callback) => {
    // console.log('===> event: ', Object.keys(event));
    // if (context) console.log('===> context: ', Object.keys(context));
    // if (callback) console.log('===> callback: ', Object.keys(callback));
    try {
      // extremely minimal clone of express
      var request = {
        body: event
      };
      var response = {
        body: null,
        json: function(obj) {
          this.body = obj;
        },
        send: function(obj) {
          this.body = obj;
        },
        end: function() {
          this.body = '';
        }
      };
      if (event.httpMethod) {
        // HTTP requests
        // console.log(`==> httpMethod - event.body: `, event.body);
        // console.log(`===> Headers: `, event.headers);
        request.body = request.body.body;
        if (typeof request.body == 'string') request.body = JSON.parse(request.body);
      } else {
        // Lambda event requests (Used by Alexa Skill)
      }

      // console.log('*** Request received: ', JSON.stringify(request.body, null, 2));
      await p.handleRequest(request, response);
      // console.log('*** Returning response: ', JSON.stringify(response.body, null, 2));

      // console.log('*** Request handled.... response: ', JSON.stringify(response.body, null, 2));
      if (event.httpMethod) {
        // HTTP requests
        return {
          statusCode: 200,
          body: JSON.stringify(response.body, null, 2),
        };
      } else {
        // Alexa Skill event requests
        callback(null, response.body);
      }
    } catch(e) {
      console.log(`Error with ${p.endpoint} request - received:`, event.body);
      console.log('Error:', e)
      return {
        statusCode: 500,
        body: JSON.stringify(e, null, 2),
      };
    }

  };
})
