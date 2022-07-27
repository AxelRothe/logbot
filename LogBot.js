const chalk = require("chalk");
const LogRecord = require("./LogRecord");
const prettyjson = require("prettyjson");
const Spinnies = require("spinnies");
const errorCodes = require("./errorCodes.json");
const fs = require("fs");
const swallow = require("swallow-me");

class LogBot {
    history = [];
    verbose = true;
    errorCodes = errorCodes;
    prettyJsonOptions = {
        keysColor: "brightCyan",
        dashColor: "magenta",
        stringColor: "white",
        numberColor: "brightGreen",
    };
    spinnies = new Spinnies();

    color = {
        green: chalk.hex("#00FFA3"),
        blue: chalk.hex("#008AFF"),
        darkBlue: chalk.hex("#0066bd"),
        red: chalk.hex("#ff4400"),
        yellow: chalk.hex("#ffdd00"),
        white: chalk.hex("#d0fff4"),
        purple: chalk.hex("#ee00ff"),
    };

    splash(splash) {

        let processedSplash = "";

        const parts = splash.split("\n");
        parts.forEach((line) => {
            let newLine = "";
            for (let i = 0; i < line.length; i++) {
                if (line[i] === "/" || line[i] === "(") {
                    newLine += this.color.darkBlue(line[i]);
                } else if (line[i] === "@") {
                    newLine += this.color.white(line[i]);
                } else if (line[i] === "*") {
                    newLine += this.color.blue(line[i]);
                } else if (line[i] === "#") {
                    newLine += this.color.blue(line[i]);
                } else if (line[i] === ".") {
                    newLine += this.color.blue(line[i]);
                } else {
                    newLine += this.color.white(line[i]);
                }
            }

            processedSplash += newLine + "\n";
        });

        console.log(processedSplash);
    }

    resolveErrorCode(code) {
        return this.errorCodes[code] ? this.errorCodes[code] : "UNKNOWN_ERROR (" + code + ")";
    }

    log(errorCode, message, print = this.verbose) {
        this.addToHistory(errorCode, message);

        const timestamp = Date.now();

        let colorTitle = "#00FFA3";

        let string = chalk.dim(new Date(timestamp).toLocaleString()) + "\t";

        if (errorCode.match(/(error)|(fail)|(panic)/gi)) {
            print = true;
            string += this.color.red(errorCode);
        } else if (errorCode.match(/(warn)|(warning)/gi)) {
            string += this.color.yellow(errorCode);
        } else if (errorCode.match(/(success)|(ok)|(create)/gi)) {
            //print = true;
            string += this.color.green(errorCode);
        } else {
            string += this.color.white(errorCode);
        }

        string += message ? " " + this.color.blue(message) : "";
        if (print) console.log(string);
        return string;
    }

    addToHistory(errorCode, message) {
        const logRecord = new LogRecord(errorCode, message)
        this.history.push(logRecord);
    }

    addSpinner(name, text = "NaN") {
        this.spinnies.add(name, { text: text, color: chalk.hex("#d0fff4") });
    }

    updateSpinner(name, value) {
        this.spinnies.update(name, { text: value });
    }

    endSpinner(name, type, text) {
        switch (type) {
            case "success":
                this.spinnies.succeed(name, { text: text });
                break;
            default:
                this.spinnies.fail(name, { text: text });
        }
    }

    print(message) {
        const string = chalk.hex("#008AFF").bold(message);
        console.log(string);
        return string;
    }

    getLogFromLast(index) {
        return this.history[this.history.length - index]
            ? this.history[this.history.length - index].message
            : "";
    }

    render(data) {
        return prettyjson.render(data, this.prettyJsonOptions);
    }

    paint(message, color) {
        if (!color) {
            message = message.toString();
            if (message.match(/(error)|(failure)|(failed)|(panic)/gi)) {
                return this.color.red(message);
            } else if (message.match(/(warn)|(warning)|(verify)|(missing)/gi)) {
                return this.color.yellow(message);
            } else if (message.match(/(success)|(done)/gi)) {
                return this.color.green(message);
            } else if (message.match(/(B)|(MB)|(GB)|(TB)|(KB)/gi)) {
                return this.color.purple(message);
            } else {
                return this.color.white(message);
            }
        } else {
            switch (color) {
                case "green":
                    return this.color.green(message);
                case "yellow":
                    return this.color.yellow(message);
                case "red":
                    return this.color.red(message);
                case "purple":
                    return this.color.purple(message);
            }
        }
    }
}
module.exports = new LogBot();
