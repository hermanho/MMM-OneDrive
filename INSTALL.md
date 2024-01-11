## Installation
1. Install Module
```sh
git clone https://github.com/hermanho/MMM-OneDrive.git
cd MMM-OneDrive
npm install
```

2. If you are using Docker
```sh
cd ~/magic_mirror/modules
git clone https://github.com/hermanho/MMM-OneDrive.git
docker exec -it -w /opt/magic_mirror/modules/MMM-OneDrive magic_mirror npm install
```

### Authorise OAuth Token

1. Clone this repo in your local pc and execute `npm install`
2. At first execution, It will open a browser and will ask you to login Microsoft account.
3. Authorize it and close the browser
   
   <img src="images/authorize.png" width="300">
5. Copy the file `msal/token.json` to the folder `MMM-OneDrive` in the remote device
