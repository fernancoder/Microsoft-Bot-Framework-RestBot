var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var collection = require('../dialogs/DialogCollection');
var session = require('../Session');
var consts = require('../consts');
var request = require('request');
var uuid = require('node-uuid');
var RestBot = (function (_super) {
    __extends(RestBot, _super);
    function RestBot(options) {
        _super.call(this);
        this.options = {
            defaultDialogId: '/',
            minSendDelay: 1000
        };
        this.configure(options);
    }
    RestBot.prototype.configure = function (options) {
        if (options) {
            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    this.options[key] = options[key];
                }
            }
        }
    };    
    RestBot.prototype.listen = function (options) {
        var _this = this;
        this.configure(options);
        return function (req, res) {
            if (req.body) {
                _this.dispatchMessage(null, req.body, _this.options.defaultDialogId, _this.options.defaultDialogArgs, res);
            }
            else {
                var requestData = '';
                req.on('data', function (chunk) {
                    requestData += chunk;
                });
                req.on('end', function () {
                    try {
                        var msg = JSON.parse(requestData);
                        _this.dispatchMessage(null, msg, _this.options.defaultDialogId, _this.options.defaultDialogArgs, res);
                    }
                    catch (e) {
                        _this.emit('error', new Error('Mensaje Bot Framework inválido'));
                        res.send(400);
                    }
                });
            }
        };
    };
    RestBot.prototype.dispatchMessage = function (userId, message, dialogId, dialogArgs, res) {
        var _this = this;
        try {
            if (!message || !message.type) {
                this.emit('error', new Error('Invalid Bot Framework Message'));
                return res ? res.send(400) : null;
            }
            /*if (!userId) {
                if (message.from && message.from.id) {
                    userId = message.from.id;
                }
                else {
                    this.emit('error', new Error('Invalid Bot Framework Message'));
                    return res ? res.send(400) : null;
                }
            }*/

            var sessionId;
            if (message.botConversationData && message.botConversationData[consts.Data.SessionId]) {
                sessionId = message.botConversationData[consts.Data.SessionId];
            }
            else {
                sessionId = uuid.v1();
                message.botConversationData = message.botConversationData || {};
                message.botConversationData[consts.Data.SessionId] = sessionId;
            }

            this.emit(message.type, message);
            if (message.type == 'Message') {

                var ses = new session.Session({
                    localizer: this.options.localizer,
                    minSendDelay: this.options.minSendDelay,
                    dialogs: this,
                    dialogId: dialogId,
                    dialogArgs: dialogArgs
                });
                ses.on('send', function (reply) {

                    console.log("reply:");
                    console.log(reply);

                    reply = reply || {};
                    reply.botConversationData = message.botConversationData;
                    if (reply.text && !reply.language && message.language) {
                        reply.language = message.language;
                    }
                    var data = {
                        userData: ses.userData,
                        conversationData: ses.conversationData,
                        perUserConversationData: ses.perUserInConversationData
                    };
                    data.perUserConversationData[consts.Data.SessionState] = ses.sessionState;

                    _this.saveData(userId, sessionId, data, reply, function (err) {
                        if (res) {
                            _this.emit('reply', reply);
                            res.send(200, reply);
                            res = null;
                        }                        
                    });
                });
                ses.on('error', function (err) {
                    _this.emit('error', err, ses.message);
                    if (res) {
                        res.send(500);
                    }
                });
                ses.on('quit', function () {
                    _this.emit('quit', ses.message);
                });
                this.getData(userId, sessionId, message, function (err, data) {
                    if (!err) {
                        var sessionState;
                        ses.userData = data.userData || {};
                        ses.conversationData = data.conversationData || {};
                        ses.perUserInConversationData = data.perUserConversationData || {};
                        if (ses.perUserInConversationData.hasOwnProperty(consts.Data.SessionState)) {
                            sessionState = ses.perUserInConversationData[consts.Data.SessionState];
                            delete ses.perUserInConversationData[consts.Data.SessionState];
                        }
                        ses.dispatch(sessionState, message);
                    }
                    else {
                        _this.emit('error', err, message);
                    }
                });
            }
            else if (res) {
                var msg;
                switch (message.type) {
                    case "botAddedToConversation":
                        msg = this.options.groupWelcomeMessage;
                        break;
                    case "userAddedToConversation":
                        msg = this.options.userWelcomeMessage;
                        break;
                    case "endOfConversation":
                        msg = this.options.goodbyeMessage;
                        break;
                }
                res.send(msg ? { type: message.type, text: msg } : {});
            }
        }
        catch (e) {
            this.emit('error', e instanceof Error ? e : new Error(e.toString()));
            res.send(500);
        }
    };
    RestBot.prototype.getData = function (userId, sessionId, msg, callback) {
        var botPath = '/' + this.options.appId;
        var userPath = botPath + '/users/' + userId;
        var convoPath = botPath + '/conversations/' + sessionId;
        var perUserConvoPath = botPath + '/conversations/' + sessionId + '/users/' + userId;
        var ops = 3;
        var data = {};
        function load(id, field, store, botData) {
            data[field] = botData;
            if (store) {
                store.get(id, function (err, item) {
                    if (callback) {
                        if (!err) {
                            data[field] = item;
                            if (--ops == 0) {
                                callback(null, data);
                            }
                        }
                        else {
                            callback(err, null);
                            callback = null;
                        }
                    }
                });
            }
            else if (callback && --ops == 0) {
                callback(null, data);
            }
        }
        load(userPath, 'userData', this.options.userStore, msg.botUserData);
        load(convoPath, 'conversationData', this.options.conversationStore, msg.botConversationData);
        load(perUserConvoPath, 'perUserConversationData', this.options.perUserInConversationStore, msg.botPerUserInConversationData);
    };
    RestBot.prototype.saveData = function (userId, sessionId, data, msg, callback) {
        var botPath = '/' + this.options.appId;
        var userPath = botPath + '/users/' + userId;
        var convoPath = botPath + '/conversations/' + sessionId;
        var perUserConvoPath = botPath + '/conversations/' + sessionId + '/users/' + userId;
        var ops = 3;
        function save(id, field, store, botData) {
            if (store) {
                store.save(id, botData, function (err) {
                    if (callback) {
                        if (!err && --ops == 0) {
                            callback(null);
                        }
                        else {
                            callback(err);
                            callback = null;
                        }
                    }
                });
            }
            else {
                msg[field] = botData;
                if (callback && --ops == 0) {
                    callback(null);
                }
            }
        }
        save(userPath, 'botUserData', this.options.userStore, data.userData);
        save(convoPath, 'botConversationData', this.options.conversationStore, data.conversationData);
        save(perUserConvoPath, 'botPerUserInConversationData', this.options.perUserInConversationStore, data.perUserConversationData);
    };
    return RestBot;
})(collection.DialogCollection);
exports.RestBot = RestBot;

