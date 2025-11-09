# Installation

1. Install Module

   Run the following command. For example, the Magic Mirror directory is `~/MagicMirror`.
   ```sh
   cd ~/MagicMirror/modules
   git clone https://github.com/hermanho/MMM-OneDrive.git
   cd MMM-OneDrive
   npm run install-prod
   ```

   If you are using Docker

   ```sh
   cd ~/MagicMirror/modules
   git clone https://github.com/hermanho/MMM-OneDrive.git
   docker exec -it -w /opt/magic_mirror/modules/MMM-OneDrive magic_mirror npm run install-prod
   ```

1. Add MMM-OneDrive module config in ~/MagicMirror/config/config.js

## Upgrade

  Run the following command. For example, the Magic Mirror directory is `~/MagicMirror`.
  ```sh
  cd ~/MagicMirror/modules/MMM-OneDrive
  git pull
  npm run install-prod
  ```

## Authorise OAuth Token

### On-device (SSH or VNC with Desktop UI)

   1. Start MagicMirror as usual

      ```sh
      cd ~/MagicMirror
      npm start
      ```

   1. At the first time execution, a message will be shown about the Device Code and sign in URL in the terminal.
      ```
      [2025-03-18 01:23:45.000] [INFO]  [ONEDRIVE:AuthProvider] To sign in, use a web browser to open the page https://www.microsoft.com/link and enter the code ABCZ68UH to authenticate.
      ```
      You can see the message on screen also.
      <br />
      <img src="images/devicecode-message.jpg" width="300">
   1. Open the URL in your mobile phone / PC / any device and follow the instructions
      <br />
      <img src="images/input-devicecode.jpg" width="300">
      <br />
      <img src="images/authorize.png" width="300">
      <br />
      <img src="images/signed-in.png" width="300">

### Sperated machine (legacy way)

   1. Install a copy in your local machine (Win / Mac)
   1. Update MagicMirror config file `config/config.js` and turn on the flag `forceAuthInteractive: true`
   1. Start MagicMirror as usual

      ```sh
      cd ~/MagicMirror
      npm start
      ```

   1. At the first time execution, it will be opened a browser and will ask you to login Microsoft account.
   1. Authorize it and close the browser when done
      <br />
      <img src="images/authorize.png" width="300">
      <br />
      <img src="images/signed-in.png" width="300">
      
   1. Copy the file `msal/token.json` to the folder `MMM-OneDrive` in the remote device
