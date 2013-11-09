'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('multiplayerPong.services', []).
  value('version', '0.1');

angular.module('multiplayerPong.services')
  .factory('Socket', function(){
    return function() {
      var that = {};
      var ws = new WebSocket('ws://localhost:3000');
      that.socket = ws;
      that.send = function(message) {
        ws.send(message);
      };
      ws.onopen = function() {
        ws.send('hello world');
      };
      ws.onmessage = function(data, flags) {
        // flags.binary will be set if a binary data is received
        // flags.masked will be set if the data was masked
      };
      return that;
    };
  });
