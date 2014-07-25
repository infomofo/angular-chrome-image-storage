'use strict';
angular.module("chrome-image-storage",[])
	.factory('chrome-image-storage', function($q, $http){

		var StorageSupportEnum = {
		    NONE : 0,
		    CHROME : 1,
		    HTML5 : 2
		}

		var storage_type = StorageSupportEnum.NONE;
		if( chrome.storage !== undefined){
			// console.log ("you're in a chrome app. using chrome local storage.")
			storage_type = StorageSupportEnum.CHROME;
	   	} else if (window.localStorage !== undefined) {
			// console.log ("you're in a web app. using html 5 storage.")
			storage_type = StorageSupportEnum.HTML5;
	    } else {
	    	console.error ("you don't have any storage capabilities- stored-img tags will not be stored for offline use.")
	    }

		function resizeImage(url, maxWidth, callback) {
		    var sourceImage = new Image();

		    sourceImage.onload = function() {
		        // Create a canvas with the desired dimensions
		        var canvas = document.createElement("canvas");
		        var newWidth = Math.min(maxWidth, sourceImage.width);
		        var newHeight = newWidth * sourceImage.height / sourceImage.width;
		        canvas.width = newWidth;
		        canvas.height = newHeight;
		        // Scale and draw the source image to the canvas
		        // console.log("resizing from " +
		        // 	sourceImage.width + "x" + sourceImage.height +
		        // 	" to " + newWidth + "x" + newHeight);
		        canvas.getContext("2d").drawImage(sourceImage, 0, 0, newWidth, newHeight);

		        // Convert the canvas to a data URL in PNG format
		        callback(canvas.toDataURL("image/jpeg",0.8));
		    }

		    sourceImage.src = url;
		}

		/**
		 * A function specifically for retrieving images.
		 *
		 * The url is converted into a base64 image
		 */
		var getImage = function(url, maxWidth) {
			var deferred = $q.defer();
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'blob';
			xhr.onload = function(e) {
			  // console.log('Fetched image ' + url + ' via XHR: ' + e);
  			var reader = new window.FileReader();
				reader.readAsDataURL(this.response);
				reader.onloadend = function() {
	                var base64data = reader.result;
	                if (maxWidth != undefined) {
		                resizeImage(base64data, maxWidth, function(dataUrl) {
											// console.log('resized as ' + dataUrl);
											deferred.resolve(dataUrl);
		                });
	            	} else {
	            		deferred.resolve(base64data);
	            	}
				};
    	};
			xhr.send();
			return deferred.promise;
		}

		/**
		 * A function for retrieving images and storing in html 5 local storage.
		 */
		var getChromeLocallyStoredImage = function(url, maxWidth) {
			var deferred = $q.defer();

			var area = chrome.storage.local; // change this to chrome.storage.sync for sync capabilities

      area.get(url, function(value) {
      	var keyValue = value[url];
				// console.log("retrieved value for "+ url + " : " + angular.toJson(keyValue));
      	if (keyValue == undefined || keyValue == null) {
      		getImage(url, maxWidth).then(function(data) {
      			keyValue = data;
      			// console.log("caching value for "+ url + " : " + angular.toJson(keyValue));
      			var saveObject = {};
      			saveObject[url] = keyValue;
						// TODO: Add local caching to speed up retrieval
      			// cachedImages[url] = keyValue;
      			area.set(saveObject, function() {
      				if (chrome.runtime.lasterror){
			            console.error(chrome.runtime.lasterror.message);
			        } else {
	    				// console.log('saved ' + keyValue + " to key " + url);
	    			}
      			});
      			deferred.resolve(keyValue);
      		});
      	} else {
        	deferred.resolve(keyValue);
        }
      });
			return deferred.promise;
		}

		/**
		 * A function for retrieving images and storing in html 5 local storage.
		 */
		var getHtml5StoredImage = function(url, maxWidth) {
			var deferred = $q.defer();

			var keyValue = localStorage.getItem(url);
			// console.log("retrieved value for "+ url + " : " + angular.toJson(keyValue));
			if (keyValue !== null) {
				deferred.resolve(keyValue);
			} else {
				getImage(url, maxWidth).then(function(data) {
	        			keyValue = data;
	        			deferred.resolve(keyValue);
	        			// console.log("saveItem caching value for "+ url + " : " + angular.toJson(keyValue));
	        			localStorage.setItem(url, keyValue);
	        		});
			}
			return deferred.promise;
		}

		return {
			getImage: function(url, maxWidth) {
				return getImage(url, maxWidth);
			},
			getStoredImage: function(url, maxWidth) {
				switch (storage_type) {
					case StorageSupportEnum.CHROME:
						// console.log ("you're in a chrome app. using chrome local storage.");
						return getChromeLocallyStoredImage(url, maxWidth);
						break;
					case StorageSupportEnum.HTML5:
						// console.log ("you're in a web app. using html 5 storage.")
						return getHtml5StoredImage(url, maxWidth);
						break;
					default:
	    				// console.log ("you don't have any storage capabilities- using pass through.")
						return getImage(url, maxWidth)
				}
			}
		}
	})
	.directive("base64Img",function() {
	    return {
	        restrict: "E",
	        scope: {dataSrc: '@ngUrl',
	    			maxWidth: '@maxWidth'},
	        template: '<img ng-src="{{storedImage}}"/>',
	        controller: ['$scope', '$timeout', 'chrome-image-storage', '$element',function($scope, $timeout, chromeImageStorage, $element){
	        	$scope.storedImage = null;
	        	chromeImageStorage.getImage($scope.dataSrc, $scope.maxWidth).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	.directive("storedImg", function(){
	    return {
	        restrict: "E",
	        scope: {dataSrc: '@ngUrl',
	    			maxWidth: '@maxWidth'},
	        template: '<img ng-src="{{storedImage}}"/>',
	        controller: ['$scope', '$timeout', 'chrome-image-storage', '$element',function($scope, $timeout, chromeImageStorage, $element){
	        	$scope.storedImage = null;
	        	chromeImageStorage.getStoredImage($scope.dataSrc, $scope.maxWidth).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	;
