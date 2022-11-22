class LogRecord {
    title;
    message;
    params;

    constructor(title, message, ...params) {
        this.title = title;
        this.message = message;
        this.params = params;
    }

    toString() {
        return this.title + " " + this.message + " " + this.params.join(" ");
    }
}
module.exports = LogRecord;
