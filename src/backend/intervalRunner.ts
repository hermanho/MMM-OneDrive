
export function createIntervalRunner(render: (() => Promise<unknown>), interval: number) {
  const state = { stopped: false, running: false };
  let skipWait: ((value: unknown) => void) | null = null;

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
        skipWait(null);
      }
    },
    stop: () => {
      console.info("[IntervalRunner]: Stopping");
      state.stopped = true;
      if (skipWait) skipWait(null);
    },
    resume: () => {
      console.info("[IntervalRunner]: To resume");
      if (!state.running) {
        console.info("[IntervalRunner]: Resuming");
        state.stopped = false;
        cycle();
      }
    },
    state: () => ({ ...state }),
  };
}

export type IntervalRunner = ReturnType<typeof createIntervalRunner>;