## Installation
1. Install Module
   ```sh
   cd ~/magic_mirror/modules
   git clone https://github.com/hermanho/MMM-OneDrive.git
   cd MMM-OneDrive
   npm install
   ```
   If you are using Docker
   ```sh
   cd ~/MagicMirror/modules
   git clone https://github.com/hermanho/MMM-OneDrive.git
   docker exec -it -w /opt/magic_mirror/module MMM-OneDrive magic_mirror npm install
   ```

1. Add MMM-OneDrive module config in ~/MagicMirror/config/config.js

## Authorise OAuth Token

### On-device (Just do it on Raspberry PI with Desktop UI)
   1. Start MagicMirror as usual
      ```
      cd ~/MagicMirror
      npm start
      ```
   1. At first execution, It will open a browser and will ask you to login Microsoft account.
   1. Authorize it and close the browser when done
      <img src="images/authorize.png" width="300">
      <img src="images/signed-in.png" width="300">
   
### Sperated machine (When the device does not have Desktop UI)
   1. Install a copy in your local machine (Win / Mac)
   1. Start MagicMirror as usual
      ```
      cd ~/MagicMirror
      npm start
      ```
   1. At first execution, It will open a browser and will ask you to login Microsoft account.
   1. Authorize it and close the browser when done
      <img src="images/authorize.png" width="300">
      <img src="images/signed-in.png" width="300">
   1. Copy the file `msal/token.json` to the folder `MMM-OneDrive` in the remote device
