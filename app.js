/*-----------------------------------------------------------------------------
This Bot demonstrates how to use a LuisDialog to add natural language support
to a bot. 

For a complete walkthrough of creating this bot see the article below.

    http://docs.botframework.com/builder/node/understanding-natural-language/

-----------------------------------------------------------------------------*/

var builder = require('botbuilder');
var restify = require('restify');

// Create LUIS Dialog that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=4017b531-5533-4611-afa5-5ab5fdbc6091&subscription-key=9122d4f6bb814bf3a37f013e472f23d4&q=';
var dialog = new builder.LuisDialog(model);
var restBot = new builder.RestBot({appId: '514a8c70-13f5-12e9-be56-a63b0ae2859c'});
restBot.add('/', function (session) {
  if (session.userData.city) {
    switch(session.message.text){
      case "1":
        session.send("%s tiene un clima espectacular.\n\n¿Que más quieres saber de %s?\n\n1-Su clima\n2-Sus paisajes\n3-Su gente", session.userData.city, session.userData.city);
      break;
      case "2":
        session.send("El paisaje en %s te deja sin respiración.\n\n¿Que más quieres saber de %s?\n\n1-Su clima\n2-Sus paisajes\n3-Su gente", session.userData.city, session.userData.city);
      break;
      case "3":
        session.send("Sea de día o de noche el ambiente de %s es insuperable.\n\n¿Que más quieres saber de %s?\n\n1-Su clima\n2-Sus paisajes\n3-Su gente", session.userData.city, session.userData.city);
      break;
      default:
        session.send('%s es una ciudad preciosa. ¿Que quieres saber de %s?\n\n1-Su clima\n2-Sus paisajes\n3-Su gente', session.message.text, session.message.text);
        session.userData.city = session.message.text;
      break;
    }
  }
  else
  {
    session.send('%s es una ciudad preciosa. ¿Que quieres saber de %s?\n\n1-Su clima\n2-Sus paisajes\n3-Su gente', session.message.text, session.message.text);
    session.userData.city = session.message.text;
  }
});

// Setup Restify Server
const server = restify.createServer();
server.post('/api/messages', restBot.listen());
server.listen(process.env.PORT || 8080, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


