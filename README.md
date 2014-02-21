angular-chrome-image-storage
============================

An angular directive module that can be used to retrieve images as base64 encodings and cache images in chrome local storage.

Instructions
------------

### [Optional] Install the chrome module using bower

Install using bower install

    bower install infomofo/angular-chrome-image-storage

Add the following script import

```html
    <script src="bower_components/angular-chrome-image-storage/angular-chrome-image-storage.js"></script>
```

### Import the chrome-image-storage module

```javascript
angular.module('myapp',['chrome-image-storage']);
```

### HTML

There are two directives supplied by this module.

```html
<base64-img ng-url="http://image-to-store/blah.png"/>
```
Retrieves the specified url as a base64 image, and replaces the element with an image with the base64 png as the source.  This directive can be used in any angular application.

```html
<stored-img ng-url="http://image-to-store/blah.png"/>
```
Retrieves the specified url as a base64 image, and replaces the element with an image with the base64 png as the source, and caches the image for offline access.  This directive will ONLY work in a chrome extension with ``storage`` permission explicitly requested.

```json
  "permissions": [
    "storage",
    ...
  ]
```

### How it works

Upon loading the base64-img directive, the http url will be converted into an equivalent base64 image.

If you are using the stored-img directive, the http url will be convrted into an equivalent base64 image, and stored in chrome.storage.local, with the key equivalent to the url of the image.

