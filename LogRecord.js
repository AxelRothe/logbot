class LogRecord {
    title;
    message;
    params;

    constructor(title, message, ...params) {
        this.title = title;
        this.message = message;
        this.params = params;
    }
}
module.exports = LogRecord;
