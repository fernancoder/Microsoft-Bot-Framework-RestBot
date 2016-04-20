# Microsoft Bot Framework RestBot
bot for Microsoft Bot Framework to node.js applications accessible via http

Microsoft Bot Framework (https://dev.botframework.com/) include bot connectors to text/sms, Office 365 mail, Skype, Slack, and other services.

This bot connector allows you to build node.js applications accessible via http

## Instalation
- Execute from command line:
```bash
$ mkdir test_httpbot
$ cd test_httpbot
$ npm init
$ npm install --save botbuilder
$ npm install --save restify
```
- Include RestBot.js under test_httpbot/node_modules/botbuilder/lib/bots
- Include this lines in test_httpbot/node_modules/botbuilder/lib/botbulder.js as last require and exports blocks
```javasript
var rest = require('./bots/RestBot');
exports.RestBot = rest.RestBot;
```
