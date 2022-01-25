/**
 * @typedef {Object} Log
 * @property {string} message
 * @property {*} value
 */

class LogBot {
	constructor(){
		this.LAUNCH_TIME = Date.now();
		this.active = true;
		/**
		 * Log Container
		 * @type {Log[]}
		 */
		this.logs = []
	}

	/**
	 * Activate the LogBot
	 */
	activate(){
		this.active = true
	}

	/**
	 * Deactivate the LogBot
	 */
	deactivate(){
		this.active = false
		this.log("Logging has been disabled. You can activate logging in the config file or when initializing the PRSNC Client.")
	}

	/**
	 * returns all Logs
	 *
	 * @return {Log[]}
	 */
	getLogs(){
		return  this.logs
	}

	/**
	 * Log this.
	 *
	 * @param type
	 * @param msg
	 * @param values whatever you need to print as values
	 * @param timestamp is automatic set to now()
	 */
	log(type, msg, values="NaN", timestamp=Date.now()) {
		if (this.active) {
			let message = '%c' + (timestamp - this.LAUNCH_TIME) + 'ms' + ' %c[' + type.toUpperCase() + '] %c' + msg + "%c ::"
			this.logs.push({message: message, value: values})
			if (type.match(/(error)|(failure)/ig)) {
				console.log(message, "color:orange;", "color:red;font-weight:bold;", "color: inherit;", "color:red;font-weight:bold;", values)
			} else {
				console.log(message, "color:orange;", "color:teal;font-weight:bold;", "color: inherit;", "color:gray;font-weight:bold;", values)
			}
		}
	}
}
module.exports.LogBot = new LogBot();