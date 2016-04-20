# Microsoft Bot Framework RestBot
Microsoft Bot Framework compatilbe bot library for node.js applications accessible via http
## About
Microsoft Bot Framework (https://dev.botframework.com/) includes bot connectors to text/sms, Office 365 mail, Skype, Slack, and other services.

This bot connector allows you to build node.js bot applications accessible via http

## Instalation
- Create a new node.js application executing this from command line:
```bash
$ mkdir test_httpbot
$ cd test_httpbot
$ npm init
$ npm install --save botbuilder
$ npm install --save restify
```
- Copy RestBot.js from this repository to test_httpbot/node_modules/botbuilder/lib/bots
- Include this lines in test_httpbot/node_modules/botbuilder/lib/botbulder.js at end of require and exports blocks
```javasript
var rest = require('./bots/RestBot');
exports.RestBot = rest.RestBot;
```
## Work in progess
This works but it is work in progress. This library is the result of a mix between TextBot.js and BotConnectorBot.js (AKA cust&paste). Both the code and the message formats must be simplified and optimized.
## Testing
This example is based on basics-naturalLanguage example included in the Microsoft Bot Framework (https://github.com/Microsoft/BotBuilder) 
- Copy app.js from this repository to test_httpbot
- Execute node app.js from the command line:
```bash
$ node app.js 
restify listening to http://[::]:8080
```
- Execute a REST client simulator like [Chrome Advanced REST client](https://chrome.google.com/webstore/detail/advanced-rest-client/hgmloofddffdnphfgcellkdfbfbjeloo/)
- Send post requests to http://localhost:8080/v1/chat copypasting messages included in message_1.json, message_2.json and message_3.json (order is important)


