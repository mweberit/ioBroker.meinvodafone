"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
var adapter = utils.adapter('meinvodafone');
const request = require('request');

class Meinvodafone extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "meinvodafone",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config username: " + this.config.username);
		this.log.info("config password: " + this.config.password);
		this.log.info("config number: " + this.config.number);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("used", {
			type: "state",
			common: {
			        name: "Actual used data",
			        type: "number",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("remaining", {
			type: "state",
			common: {
			        name: "Actual remaining data",
			        type: "number",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("total", {
			type: "state",
			common: {
			        name: "Total data",
			        type: "number",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("unitOfMeasure", {
			type: "state",
			common: {
			        name: "Unit of measure",
			        type: "string",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("lastUpdateDate", {
			type: "state",
			common: {
			        name: "Last update date",
			        type: "string",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("getData", {
			type: "state",
			common: {
				name: "Get data from MeinVodafone now",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("getData");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw iobroker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			//this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		
			if (id.endsWith(".getData") && state.val == true) {
				this.log.info("getData");

				this.setStateAsync("getData", { val: false, ack: true });
				
				request({
				        url : "https://www.vodafone.de/mint/rest/session/start",
				        method : "POST",
				        headers : {
				            "Content-Type" : "application/json",
				            "Accept" : "application/json"
				        },
				        body: JSON.stringify({
				            "clientType" : "Portal",
				            "username" : this.config.username,
				            "password" : this.config.password
				        })
				    },
				    function (error, response, body) {
				        adapter.log.info('1. error: ' + error);
				        adapter.log.info('1. response: ' + JSON.stringify(response));
				        adapter.log.info('1. body: ' + body);

					var json = JSON.parse(response);
					var statusCode = json.operationError;    
					if (statusCode != 200) {
					        adapter.log.error(json.body.operationError.message);
						return;
					}
				
				        var cookies = response.headers['set-cookie'];
				        //adapter.log.info('cookies: ' + cookies);
				
				        var cookie = cookies.join(';');
				        //adapter.log.info('cookie: ' + cookie);
				
				        request({
				                url : "https://www.vodafone.de/api/enterprise-resources/core/bss/sub-nil/mobile/payment/service-usages/subscriptions/" + adapter.config.number + "/unbilled-usage",
				                method : "GET",
				                headers : {
				                    "x-vf-api" : "1499082775305",
				                    "Referer" : "https://www.vodafone.de/meinvodafone/services/",
				                    "Accept" : "application/json",
				                    "Cookie" : cookie
				                }
				            },
				            function (error, response, body) {
					        adapter.log.info('2. error: ' + error);
					        adapter.log.info('2. response: ' + JSON.stringify(response));
				                var json = JSON.parse(response.body);
				                var used = json.serviceUsageVBO.usageAccounts[0].usageGroup[0].usage[0].used;
				                var remaining = json.serviceUsageVBO.usageAccounts[0].usageGroup[0].usage[0].remaining;
				                var total = json.serviceUsageVBO.usageAccounts[0].usageGroup[0].usage[0].total;
						adapter.setStateAsync("used", { val: Number(used), ack: true });
						adapter.setStateAsync("remaining", { val: Number(remaining), ack: true });
						adapter.setStateAsync("total", { val: Number(total), ack: true });
						adapter.setStateAsync("unitOfMeasure", { val: json.serviceUsageVBO.usageAccounts[0].usageGroup[0].usage[0].unitOfMeasure, ack: true });
						adapter.setStateAsync("lastUpdateDate", { val: json.serviceUsageVBO.usageAccounts[0].usageGroup[0].usage[0].lastUpdateDate, ack: true });
				            }
				        );
				    }
				);
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Meinvodafone(options);
} else {
	// otherwise start the instance directly
	new Meinvodafone();
}
