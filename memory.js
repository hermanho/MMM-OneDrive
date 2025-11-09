/**
 * GPU Memory Monitor for Raspberry Pi
 * Uses vcgencmd to get VideoCore GPU memory usage
 */

const { execSync } = require("child_process");
const os = require("os");
const fs = require("fs");

/**
 * Get swap memory information from /proc/meminfo
 * @returns {{total: number, free: number, used: number, cached: number}}
 */
function getSwapMemory() {
  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    
    const swapTotal = Number(meminfo.match(/SwapTotal:\s+(\d+)/)?.[1] || "0") / 1024; // KB to MB
    const swapFree = Number(meminfo.match(/SwapFree:\s+(\d+)/)?.[1] || "0") / 1024;
    const swapCached = Number(meminfo.match(/SwapCached:\s+(\d+)/)?.[1] || "0") / 1024;
    const swapUsed = swapTotal - swapFree;

    return {
      total: Number(swapTotal.toFixed(2)),
      free: Number(swapFree.toFixed(2)),
      used: Number(swapUsed.toFixed(2)),
      cached: Number(swapCached.toFixed(2)),
    };
  } catch (error) {
    return {
      total: 0,
      free: 0,
      used: 0,
      cached: 0,
      error: error.message,
    };
  }
}

/**
 * Get GPU memory information from Raspberry Pi
 * @returns {{allocated: number, free: number, used: number, reloc: number}}
 */
function getGPUMemory() {
  try {
    // Get GPU memory allocation
    const allocStdout = execSync("vcgencmd get_mem gpu", { encoding: "utf8" });
    const allocated = Number(allocStdout.match(/gpu=(\d+)M/)?.[1] || "0");

    // Get detailed memory info from vcgencmd
    const relocStdout = execSync("vcgencmd get_mem reloc", { encoding: "utf8" });
    const reloc = Number(relocStdout.match(/reloc=(\d+)M/)?.[1] || "0");

    // Get memory split info
    const relocTotalStdout = execSync("vcgencmd get_mem reloc_total", { encoding: "utf8" });
    const relocTotal = Number(relocTotalStdout.match(/reloc_total=(\d+)M/)?.[1] || "0");

    // Calculate used/free
    // Note: This is approximate as VideoCore doesn't expose detailed usage
    const used = reloc;
    const free = allocated - reloc;

    return {
      allocated: allocated,  // Total GPU memory allocated
      free: free >= 0 ? free : 0,
      used: used,
      reloc: reloc,  // Relocatable memory
      relocTotal: relocTotal,
    };
  } catch (error) {
    // Not on Raspberry Pi or vcgencmd not available
    return {
      allocated: 0,
      free: 0,
      used: 0,
      reloc: 0,
      relocTotal: 0,
      error: error.message,
    };
  }
}

/**
 * Get complete memory information including RAM, Swap, and GPU
 * @returns {{ram: {total: number, free: number, used: number}, swap: {total: number, free: number, used: number, cached: number}, gpu: {allocated: number, free: number, used: number, reloc: number}}}
 */
function getCompleteMemoryInfo() {
  const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
  const freeRam = (os.freemem() / 1024 / 1024).toFixed(2);
  const usedRam = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(2);

  const swap = getSwapMemory();
  const gpu = getGPUMemory();

  return {
    ram: {
      total: Number(totalRam),
      free: Number(freeRam),
      used: Number(usedRam),
    },
    swap: swap,
    gpu: gpu,
  };
}

/**
 * Format complete memory info as a log string
 * @returns {string}
 */
function getCompleteMemoryString() {
  const memInfo = getCompleteMemoryInfo();
  
  const lines = [];
  
  // RAM line
  lines.push(`RAM:    total: ${memInfo.ram.total} MB; free: ${memInfo.ram.free} MB; used: ${memInfo.ram.used} MB`);
  
  // Swap line
  if (memInfo.swap.error) {
    lines.push(`SWAP:   N/A (${memInfo.swap.error})`);
  } else if (memInfo.swap.total === 0) {
    lines.push("SWAP:   disabled");
  } else {
    lines.push(`SWAP:   total: ${memInfo.swap.total} MB; free: ${memInfo.swap.free} MB; used: ${memInfo.swap.used} MB; cached: ${memInfo.swap.cached} MB`);
  }
  
  // GPU line
  if (memInfo.gpu.error) {
    lines.push(`GPU:    N/A (${memInfo.gpu.error})`);
  } else {
    lines.push(`GPU:    allocated: ${memInfo.gpu.allocated} MB; reloc: ${memInfo.gpu.reloc} MB (used: ~${memInfo.gpu.used} MB; free: ~${memInfo.gpu.free} MB)`);
  }
  
  return lines.join("\n");
}

/**
 * Format GPU memory info as a log string
 * @returns {string}
 */
function getGPUMemoryString() {
  const gpuMem = getGPUMemory();
  
  if (gpuMem.error) {
    return `GPU:    N/A (${gpuMem.error})`;
  }

  return `GPU:    allocated: ${gpuMem.allocated} MB; reloc: ${gpuMem.reloc} MB (used: ~${gpuMem.used} MB; free: ~${gpuMem.free} MB)`;
}

module.exports = {
  getSwapMemory,
  getGPUMemory,
  getCompleteMemoryInfo,
  getCompleteMemoryString,
  getGPUMemoryString,
};
