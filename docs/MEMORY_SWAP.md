# Memory & Swap Requirements

This module performs photo caching and occasional image processing which can use a non-trivial amount of memory. To ensure stable operation we recommend the following minimum memory configuration:

- Recommended: **4 GB** or above physical memory.
- If the system has **less than 4 GB** of physical memory, you must provide at least **2 GB** of swap space.

## Why this matters

Insufficient RAM can cause large-image processing (e.g., high-res JPEGs) to spike memory in the Chromium renderer, which may be killed by the OS or Chromium's protections. When the renderer is terminated the module or UI can crash or become unresponsive — adding ≥ 2 GB swap on systems with <4 GB RAM reduces this risk.

## How to update the swap size in Raspberry Pi OS

### For v12 Bookworm and below
1. Open the config file
    ```bash
    sudo nano /etc/dphys-swapfile
    ```
2. Find the line that says `CONF_SWAPSIZE=100` and change it to `CONF_SWAPSIZE=2048`.
3. Save the file and exit the editor.
4. Restart the Raspberry Pi to apply the changes:

### For v13 Trixie and above
1. Open the config file
    ```bash
    sudo nano /etc/rpi/swap.conf
    ```
2. Update the file content as below:
    ```
    [Main]
    Mechanism=swapfile

    [File]
    RamMultiplier=2
    ```
3. Save the file and exit the editor.
4. Restart the Raspberry Pi to apply the changes:
