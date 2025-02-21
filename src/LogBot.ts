import chalk from "chalk"
import { LogRecord } from "@/LogRecord.js"
import prettyjson from "prettyjson"
import Spinnies from "spinnies"
import progressbar, { GenericFormatter } from "cli-progress"
import errorCodes from "@/errorCodes.js"
import fs from "node:fs"

type ColorString = "green" | "yellow" | "red" | "purple"

export class LogBot {
  private verbose = true
  private errorCodes: Record<number, string> = errorCodes
  private prettyJsonOptions = {
    keysColor: "brightCyan",
    dashColor: "magenta",
    stringColor: "white",
    numberColor: "brightGreen",
  }
  private spinnies = new Spinnies()
  private progressbars = new Map<string, progressbar.SingleBar>()

  private queue: LogRecord[] = []

  private pathToLogFile: string | null = null
  private writeStream: fs.WriteStream | null = null
  private writtingHistory = false

  private color = {
    green: chalk.hex("#00FFA3"),
    blue: chalk.hex("#008AFF"),
    darkBlue: chalk.hex("#0066bd"),
    red: chalk.hex("#ff4400"),
    yellow: chalk.hex("#ffdd00"),
    white: chalk.hex("#d0fff4"),
    purple: chalk.hex("#ee00ff"),
  }

  constructor(options?: { logfile?: string; verbose?: boolean }) {
    if (options?.logfile) this.setLogFilePath(options?.logfile)
    if (options?.verbose !== undefined) this.verbose = options?.verbose
  }

  setLogFilePath(path: string) {
    this.pathToLogFile = path

    if (this.writeStream) this.writeStream.close()

    this.writeStream = fs.createWriteStream(path, { flags: "a" })
  }

  resolveErrorCode(code: number) {
    return this.errorCodes[code]
      ? this.errorCodes[code]
      : "UNKNOWN_ERROR (" + code + ")"
  }

  /**
   * Logs a message to the console and if the pathToLogFile is set, appends the message to the log file
   *
   * @param errorCode Any HTTP status code
   * @param message A message to be logged
   * @param print Whether to print the message to the console, or just log it
   * @returns The formatted log message
   */
  log(
    errorCode: number,
    message: string,
    print: boolean = this.verbose,
  ): string {
    let errorString = this.resolveErrorCode(errorCode)

    const timestamp = Date.now()

    this.addToHistory(errorCode, message)

    let string = chalk.dim(new Date(timestamp).toLocaleString()) + "\t"

    if (errorCode >= 500) {
      print = true
      string += this.color.red(errorCode)
    } else if (errorCode >= 300) {
      string += this.color.yellow(errorCode)
    } else if (errorCode >= 200) {
      string += this.color.green(errorCode)
    } else {
      string += this.color.white(errorCode)
    }

    string += message ? " " + this.color.blue(message) : ""
    if (print) console.log(string)
    return string
  }

  private addToHistory(errorCode: number, message: string) {
    if (!this.pathToLogFile) return

    const logRecord = new LogRecord(Date.now(), errorCode, message)
    this.queue.push(logRecord)
    if (!this.writtingHistory) this.writeHistory()
  }

  private writeHistory() {
    if (!this.pathToLogFile) throw new Error("[logbotjs] No log file path set")

    const next = this.queue.shift()
    if (!next) {
      this.writtingHistory = false
      return
    }

    //append line to log file
    this.writeStream?.write(next.toString() + "\n", (err) => {
      if (err)
        console.error("[logbotjs] Error while writing to log file: " + err)
      this.writeHistory()
    })
  }

  private print(message: string) {
    const string = chalk.hex("#008AFF").bold(message)
    console.log(string)
    return string
  }

  private render(data: any) {
    return prettyjson.render(data, this.prettyJsonOptions)
  }

  private paint(message: string, color: ColorString) {
    if (!color) {
      message = message.toString()
      if (message.match(/(error)|(failure)|(failed)|(panic)/gi)) {
        return this.color.red(message)
      } else if (message.match(/(warn)|(warning)|(verify)|(missing)/gi)) {
        return this.color.yellow(message)
      } else if (message.match(/(success)|(done)/gi)) {
        return this.color.green(message)
      } else if (message.match(/(B)|(MB)|(GB)|(TB)|(KB)/gi)) {
        return this.color.purple(message)
      } else {
        return this.color.white(message)
      }
    } else {
      switch (color) {
        case "green":
          return this.color.green(message)
        case "yellow":
          return this.color.yellow(message)
        case "red":
          return this.color.red(message)
        case "purple":
          return this.color.purple(message)
      }
    }
  }

  /**
   * Adds a spinner to the console
   *
   * @param id the id of the spinner
   * @param text the text to display next to the spinner
   */
  private addSpinner(id: string, text = "NaN") {
    // @ts-ignore
    this.spinnies.add(id, { text: text, color: chalk.hex("#d0fff4") })
    this.addToHistory(200, `[process:${id}] ${text}`)
  }

  /**
   * Updates the text of a spinner
   * @param id the id of the spinner
   * @param text the text to display next to the spinner
   */
  private updateSpinner(id: string, text: string) {
    this.spinnies.update(id, { text })
    this.addToHistory(100, `[process:${id}] ${text}`)
  }

  /**
   * Ends a spinner
   *
   * @param id the id of the spinner
   * @param type the type of spinner (success or failed)
   * @param text the text to display next to the spinner
   */
  private endSpinner(id: string, type: "success" | "failed", text: string) {
    switch (type) {
      case "success":
        this.spinnies.succeed(id, { text: text })
        this.addToHistory(200, `[process:${id}] ${text}`)
        break
      default:
        this.spinnies.fail(id, { text: text })
        this.addToHistory(500, `[process:${id}] ${text}`)
    }
  }

  private addProgressBar(
    id: string,
    options: {
      total: number
      text?: string
      unit?: string
    },
  ) {
    const formatter: GenericFormatter = (options, params, payload): string => {
      const completeSize = Math.round(params.progress * (options.barsize ?? 0))
      const incompleteSize = (options.barsize ?? 0) - completeSize

      let completedChars = options.barCompleteString?.substring(0, completeSize)

      const barElems = [
        payload.aborted
          ? this.color.red(completedChars)
          : this.color.green(completedChars),
        options.barGlue,
        chalk.dim(options.barIncompleteString?.substring(0, incompleteSize)),
      ]

      let icon = payload.completed ? "✅" : "⏳"
      if (payload.aborted) icon = "❌"

      const elems = [
        barElems.join(""),
        this.color.white(
          `${Math.round(params.progress * 100)}%  ${params.value}${chalk.dim("/")}${params.total}${payload.unit}  ~${params.eta}s`,
        ),
        icon,
        payload.aborted
          ? this.color.red(payload.text)
          : this.color.blue(payload.text),
      ]

      return elems.join("  ")
    }

    const bar = new progressbar.SingleBar({
      format: formatter,
      barCompleteChar: "#",
      barIncompleteChar: "-",
      hideCursor: true,
    })

    bar.start(options.total, 0, {
      text: options.text ?? "",
      unit: options.unit ?? "",
    })

    this.progressbars.set(id, bar)
  }

  private getProgressBar(id: string) {
    let bar = this.progressbars.get(id)
    if (!bar) throw new Error(`[logbotjs] Progressbar <${id}> not found`)

    return bar
  }

  private updateProgressBar(id: string, value: number, payload?: any) {
    const bar = this.getProgressBar(id)
    bar.update(value, payload)
  }

  private incrementProgressBar(id: string, increment: number, payload?: any) {
    const bar = this.getProgressBar(id)
    bar.increment(increment, payload)
  }

  private endProgressBar(id: string, payload?: any) {
    const bar = this.getProgressBar(id)
    bar.update({
      ...payload,
      completed: true,
    })
    bar.stop()
  }

  private abortProgressBar(id: string, payload?: any) {
    const bar = this.getProgressBar(id)
    bar.update({
      ...payload,
      aborted: true,
    })
    bar.stop()
  }

  get widgets() {
    return {
      spinners: {
        create: this.addSpinner.bind(this),
      },
      spinner: (id: string) => {
        return {
          update: this.updateSpinner.bind(this, id),
          end: this.endSpinner.bind(this, id),
        }
      },
      bars: {
        create: this.addProgressBar.bind(this),
      },
      bar: (id: string) => {
        return {
          update: this.updateProgressBar.bind(this, id),
          increment: this.incrementProgressBar.bind(this, id),
          stop: this.endProgressBar.bind(this, id),
          abort: this.abortProgressBar.bind(this, id),
          getProgress: () => this.getProgressBar(id).getProgress(),
          updateETA: () => this.getProgressBar(id).updateETA(),
          setTotal: (total: number) => this.getProgressBar(id).setTotal(total),
        }
      },
    }
  }
}
