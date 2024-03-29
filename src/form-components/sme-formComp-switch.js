"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompSwitchNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.value = config.value;
        this.valueType = config.valueType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            
            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

            var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
            var valueValue = smeHelper.getNodeConfigValue(node, msg, node.valueType, node.value);
            node.log(`valueValue is: ${valueValue}`);
            if (smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                var component = {
                    refName: referenceValue || "",
                    formComponentType: "switch",
                    title: titleValue || "",
                    requiredSelection: false,
                    value: valueValue === true
                };
                smeFormMsg.dataComponent.formComponents.push(component);
            }
            
            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-switch", FormCompSwitchNode);
}