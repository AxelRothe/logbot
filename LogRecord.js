class LogRecord {
    title;
    message;
    timestamp;

    constructor(timestamp, title, message) {
        this.timestamp = timestamp;
        this.title = title;
        this.message = message;
    }

    toString() {
        return `[${new Date(this.timestamp).toLocaleString()}] ${this.title} ${this.message}`;
    }
}
module.exports = LogRecord;
