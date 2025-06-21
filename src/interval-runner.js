/**
 *
 * @param render
 * @param interval
 */
function createIntervalRunner(render, interval) {
  let skipWait = null;
  let stopped = false;
  let running = false; // To avoid multiple cycles

  /**
   *
   */
  async function cycle() {
    if (stopped) {
      running = false;
      return;
    }
    running = true;
    await render();
    await new Promise((resolve) => {
      skipWait = resolve;
      setTimeout(resolve, interval);
    });
    skipWait = null;
    if (!stopped) cycle();
    else running = false;
  }

  // Start the first cycle
  cycle();

  return {
    skipToNext: () => {
      if (skipWait) skipWait();
    },
    stop: () => {
      stopped = true;
      if (skipWait) skipWait();
    },
    resume: () => {
      if (!running) {
        stopped = false;
        cycle();
      }
    },
  };
}

module.exports = {
  createIntervalRunner,
};
