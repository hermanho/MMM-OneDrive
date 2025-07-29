/**
 *
 * @param {(() => Promise<*>)} render 
 * @param interval
 */
function createIntervalRunner(render, interval) {
  const state = { stopped: false, running: false };
  let skipWait = null;

  /**
   *
   */
  async function cycle() {
    if (state.stopped) {
      state.running = false;
      return;
    }
    state.running = true;
    try {
      await render();
    } catch (err) {
      console.error("Error in render function in IntervalRunner:");
      console.error(err);
    }
    await new Promise((resolve) => {
      skipWait = resolve;
      setTimeout(resolve, interval);
    });
    skipWait = null;
    if (!state.stopped) cycle();
    else state.running = false;
  }

  // Start the first cycle
  cycle();

  return {
    skipToNext: () => {
      if (skipWait) {
        console.info("[IntervalRunner]: Skip to next cycle");
        skipWait();
      }
    },
    stop: () => {
      console.info("[IntervalRunner]: Stopping");
      state.stopped = true;
      if (skipWait) skipWait();
    },
    resume: () => {
      console.info("[IntervalRunner]: To resume");
      if (!state.running) {
        console.info("[IntervalRunner]: Resuming");
        state.stopped = false;
        cycle();
      }
    },
  };
}

module.exports = {
  createIntervalRunner,
};
