import { LogBot } from "@/LogBot.js"

const logger = new LogBot({
  logfile: "./test/log.txt",
})

logger.log(404, "Not found")
logger.log(100, "Continue")
logger.log(200, "OK")
logger.log(500, "Internal server error")

const testSpinner = () => {
  return new Promise((resolve) => {
    const spinner = logger.widgets.spinners.create("spinner1", "Loading...")

    setTimeout(() => {
      spinner.update("Still loading...")

      setTimeout(() => {
        spinner.end("success", "Done Loading!")
        resolve(true)
      }, 1000)
    }, 1000)
  })
}

await testSpinner()

logger.log(200, "Spinner test passed.")

const testProgressBar = (abortTest: boolean) => {
  return new Promise((resolve) => {
    const bar = logger.widgets.bars.create("progress1", {
      total: 100,
      text: "Progress started",
      unit: "MB",
    })

    const progressIncrementAborted = setInterval(() => {
      if (bar.getProgress() >= 0.5 && abortTest) {
        clearInterval(progressIncrementAborted)
        bar.abort({
          text: "Process failed!",
        })
        resolve(false)
        return
      } else if (bar.getProgress() >= 1) {
        clearInterval(progressIncrementAborted)
        bar.stop({
          text: "Process completed!",
        })
        resolve(true)
        return
      }

      bar.increment(25, {
        text: "Progress updated",
      })
    }, 1000)
  })
}

await testProgressBar(true)
await testProgressBar(false)

logger.log(200, "Progress Bar Tests passed.")
