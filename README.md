# MMM-OneDrive

Display your photos from album of OneDrive on [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror). Inspired by [MMM-GooglePhotos](https://github.com/hermanho/MMM-GooglePhotos).

## Screenshot

![screenshot](images/screenshot.jpg)

## Installation & Upgrade

[INSTALL.md](INSTALL.md)

## Configuration

```javascript
{
  module: "MMM-OneDrive",
  position: "top_right",
  config: {
    albums: [], // Set your album name. like ["My wedding", "family share", "Travle to Paris"]
    updateInterval: 1000 * 60, // minimum 10 seconds.
    sort: "new", // "old", "random"
    condition: {
      fromDate: null, // Or "2018-03", RFC ... format available
      toDate: null, // Or "2019-12-25",
      minWidth: null, // Or 400
      maxWidth: null, // Or 8000
      minHeight: null, // Or 400
      maxHeight: null, // Or 8000
      minWHRatio: null,
      maxWHRatio: null,
      // WHRatio = Width/Height ratio ( ==1 : Squared Photo,   < 1 : Portraited Photo, > 1 : Landscaped Photo)
    },
    showWidth: 1080, // These values will be used for quality of downloaded photos to show. real size to show in your MagicMirror region is recommended.
    showHeight: 1920,
    timeFormat: "YYYY/MM/DD HH:mm", // Or `relative` can be used.
    forceAuthInteractive: false, // Force interactive authorization
  }
},
```

### `albums`

Now this module can access not only your owns but also shared. You can specify album title like this.

```js
albums: ["My wedding", "family share", "Travle to Paris", "from Tom"],
```

- Caution. Too many albums and photos could make long bootup delay.
- Remember this. You can only show max 8640 photos in a day. Manage your album what to show, it will make better performance.

### `updateInterval`

- Minimum `updateInterval` is 10 seconds. Too often update could makes API quota drains or network burden.

### `sort`

- `new`, `old`, `random` are supported.

### `condition`

- You can filter photos by this object.
- `fromDate` : If set, The photos which was created after this value will be loaded. (e.g: `fromDate:"2015-12-25"` or `fromDate:"6 Mar 17 21:22 UT"`)
- `toDate` : If set, The photos which was created before this value will be loaded. (e.g: `toDate:"Mon 06 Mar 2017 21:22:23 z"` or `toDate:"20130208"`)
- ISO 8601 and RFC 2822 is supported for `fromDate` and `toDate`.
- `minWidth`, `maxWidth`, `minHeight`, `maxHeight` : If set, the photos have these value as original dimensiont will be loaded. You can use these values to avoid too big or too small pictures(like icons)
- `minWHRatio`, `maxWHRatio` : With these values, you can get only portrait photos(or landscaped, or squared)
- **WHRatio** is `width / height`. So `=1` will be squared dimension. `>1` will be landscaped. `<1` will be portrait.
- Example:

```js
condition: {
  fromDate: "2018-01-01", // I don't want older photos than this.
  minWidth: 600, // I don't want to display some icons or meme-pictures from my garbage collecting albums.
  maxWHRatio: 1, // I want to display photos which are portrait.
}
```

### `showWidth`, `showHeight`

- Specify your real resolution to show.

### `timeFormat`

- Specify time format for photo info. You can also use `relative` to show more humanized.

### `debug`

- If set, more detailed info will be logged.

### `autoInfoPosition`

- For preventing LCD burning, Photo info can be relocated by condition.
  - `true` : automatically change position to each corner per 15 minutes.
  - `false` : not using.
  - callbackfunction (album, photo) : User can make his own position. It should return `[top, left, bottom, right]`

```js
autoInfoPosition: true, // or false

// User custom callback
autoInfoPosition: (album, photo)=> {
 return ['10px', '10px', 'none', 'none'] // This will show photo info top-left corner.
}

```

### scanInterval
- Optional value. How often (ms) to check OneDrive for new or updated photos. Default: `1000 * 60 * 55` (55 minutes). Lower values update more often but use more network/API.


## Toggle MMM-OneDrive module

To toggle next photos from other modules use the following codes:

```js
this.sendNotification('ONEDRIVE_PHOTO_NEXT', undefined);
```

## Tip

- Not to show photo info : Add this into your `css/custom.css`.

```css
#ONEDRIVE_PHOTO_INFO {
  display: none;
}
```

- To move photo info to other position (e.g: top-left corner): Add this into your `css/custom.css`.

```css
#ONEDRIVE_PHOTO_INFO {
  top: 10px;
  left: 10px;
  bottom: inherit;
  right: inherit;
}
```

- Not to show blurred Background : Add this into your `css/custom.css`.

```css
#ONEDRIVE_PHOTO_BACKDROP {
  display: none;
}
```

- To cover whole region with image : Add this into your `css/custom.css`.

```css
#ONEDRIVE_PHOTO_CURRENT {
  background-size: cover;
}
```

- To shrink image and be fully visible on smaller screens : Add this into your `css/custom.css`.

```css
#ONEDRIVE_PHOTO_CURRENT {
  background-size: contain;
}
```

- To display `clock` more clearly on showing in `fullscreen_below` : Add this into your `css/custom.css`.

```css
.clock {
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.5);
}
```

- To give opacity to photos:

```CSS
@keyframes trans {
  from {opacity: 0}
  to {opacity: 0.5}
}
#ONEDRIVE_PHOTO_CURRENT {
  background-size:cover;
  opacity:0.5;
}
```

## Notice

- First scanning will take a few (~dozens) seconds. Don't panic.
- If there are 1000s of photos, this scan could take minutes(over 10). longer scans increase the probablity of an error happening. If a single error happens in the scan, it will retry after 1 hour. After first successful scan, subsequent startups should go very quickly(seconds).
-

## Last Tested

- node.js: required over v18.
- MagicMirror: v2.31.0
- Modules:
  - MMM-ModuleScheduler [https://github.com/ianperrin/MMM-ModuleScheduler]
  - MMM-MagicMover [https://github.com/Lavve/MMM-MagicMover]
