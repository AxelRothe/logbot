export class LogRecord {
  code: number
  message: string
  timestamp: number

  constructor(timestamp: number, code: number, message: string) {
    this.timestamp = timestamp
    this.code = code
    this.message = message
  }

  toString() {
    return `[${new Date(this.timestamp).toLocaleString()}] [${this.code}] ${this.message}`
  }
}
