"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {	
    function validateMessage(msg) {
        if (!msg)
            throw new Error('Invalid message!');

        var type = typeof (msg);
        if (type === 'object')
            return msg;

        if (type === 'string' && msg.startsWith('{')) {
            try {
                return JSON.parse(msg);
            }
            catch{ }
        }

        return {
            Body: '' + msg,
        };
    }

    function SmeConnectorNode(config) {		
        RED.nodes.createNode(this, config);

        var server = (this.credentials && this.credentials.server) || "api.semilimes.net";
        var apiKey = this.credentials.apiKey;
        var xAccount = this.credentials.xAccount;

        var serverApiURL = `https://${server}`;
        var serverWsURL = `wss://${server}/service/ws`;

        var core = new Core();

        var apiClient = new core.SmeApiClient(serverApiURL, apiKey, xAccount);
        var webSocket = new core.SmeWebSocket(serverWsURL, apiKey, xAccount);

        var pjson = require('../package.json');

        webSocket.addStatusListener(status => {
            switch (status) {
                case 'connected': {
                    sendWebSocketMessage({
                        TypeID: 'A2A9468D-92AB-4176-B883-233FF53DDAFD',
                        Application: 'semilimes Messenger',
                        Platform: 'Node-RED',
                        Version: pjson.version,
                        Versions: {
                            NodeVersion: process.versions.node,
                            NodeREDVersion: RED.version()
                        },
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        });

        var node = this;

        node.on('close', function (removed, done) {
            webSocket.close();
            done();
        });
		
        function sendWebSocketMessage(msg) {
            msg = validateMessage(msg);
            webSocket.send(msg);
        }

        function sendApiMessage(msg) {
            msg = validateMessage(msg);
            var endpoint = msg.endpoint || "NoEndpointSet";
            var method = msg.httpMethod || "NoHttpMethodSet";
            return apiClient.callApi(endpoint, method, msg);
        }

        function callApi(endpoint, method, data) {
            return apiClient.callApi(endpoint, method, data);
        }

        function addMessageListener(listener) {
            webSocket.addMessageListener(listener);
        }

        function addStatusListener(listener) {
            webSocket.addStatusListener(listener);
        }

        //  Export
        this.postMessage = sendWebSocketMessage;
        this.sendMessage = sendApiMessage;
        this.callApi = callApi;
        this.addMessageListener = addMessageListener;
        this.addStatusListener = addStatusListener;
    };
	
    RED.nodes.registerType("sme-main-connector", SmeConnectorNode, {
        credentials: {
            server: { type: "text" },
            apiKey: { type: "text" },
            xAccount: { type: "text" }
        }
    });
};