# MMM-OneDrive Change Log

**`[1.4.1] - 2025/06/09`**
- Fixed: image failed loading due to URL expired #16
- Fixed: global variable momentjs inject problem, ignore non image file when check EXIF #20

**`[1.4.0] - 2025/06/09`**
- Fixed: HEIC image cannot be loaded #16
- Feat: Convert frontend code to typescript
- Build(deps): dependencies update:  
  - "exifreader": "^4.31.0",
  - "@rollup/plugin-commonjs": "^25.0.7",
  - "@rollup/plugin-node-resolve": "^15.2.3",
  - "@rollup/plugin-terser": "^0.4.4",
  - "@rollup/plugin-typescript": "^11.1.6",
  - "eslint": "^9.28.0",
  - "eslint-config-prettier": "^10.1.5",
  - "eslint-plugin-prettier": "^5.4.1",
  - "globals": "^15.13.0",
  - "prettier": "^3.2.4",
  - "rollup": "^4.41.2",
  - "rollup-plugin-banner2": "^1.3.1",
  - "typescript": "^5.3.3",
  - "typescript-eslint": "^8.33.1"
  - "@babel/runtime": "7.26.10"

**`[1.3.0] - 2024/12/04`**
- Fixed: no token auth flow when first time
- Feat:
  - add OAuth2.0 device code flow
  - add more logging
  - update document

**`[1.2.0] - 2024/12/04`**
- Fixed: The resource could not be found when getAlbumType #10
- Build(deps): dependencies update:
  - "@azure/msal-node": "^2.16.2"
  - "immutable": "^5.0.3"
  - "@eslint/eslintrc": "^3.2.0"
  - "@eslint/js": "^9.16.0"
  - "eslint": "^9.16.0"
  - "eslint-plugin-jsdoc": "^50.6.0"
  - "globals": "^15.13.0

**`[1.1.1] - 2024/10/09`**
- Fixed: wrap require("electron") inside the function for the headless environment

**`[1.1.0] - 2024/08/15`**
- Fixed: albumn info did not show when startup caching 
- Fixed: depedencies packages update
- Added: Allow regular expression ([RE2 engine](https://github.com/google/re2)) in album names
- Changed: Update README.md and INSTALL.md

**`[1.0.0] - 2023/07/17`**
First version
