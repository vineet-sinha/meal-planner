'use strict';

/////////////////////////////////////////
// Utilities
/////////////////////////////////////////
const __isJSONHeader = (headers)=>{
  // problem is that 'Content-Type' is case sensitive
  var contType = headers['Content-Type'];
  if (!contType) contType = headers['Content-type'];
  //if (!contType) contType = headers['content-type'];

  if (!contType) return false;
  if (contType.indexOf('application/json') != -1) return true;
  return false;
};

/////////////////////////////////////////
// Setup
/////////////////////////////////////////

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
        var request = {
          body: event.body
        };
        if (__isJSONHeader(event.headers)) request.body = JSON.parse(request.body);
        await p.handleRequest(request, response);
      } else {
        // Alexa Skill event requests
        await p.handleRequest(/*request*/{body: event}, response);
      }
      // console.log('*** Request handled.... response: ', response.body);
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
