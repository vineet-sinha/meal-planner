'use strict';

// TODO: test for google

// initialize the engine - and setup an appName so that Violet does not launch the standalone server automatically
const violet = require('violet').script('serverless');

// load the script
require('./script.js');

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
  module.exports[p.endpoint + 'Handler'] = async (event) => {
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
      await p.handleRequest(event /*request*/, response);
      return {
        statusCode: 200,
        body: JSON.stringify(response.body, null, 2),
      };
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
