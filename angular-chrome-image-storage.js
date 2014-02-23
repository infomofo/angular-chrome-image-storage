'use strict';

angular.module("chrome-image-storage",[])
	.factory('chrome-image-storage', function($q, $http){
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

			$http.get(url, {responseType: 'blob'}).success(function(blob) {
  				// console.log('Fetched image via XHR: ' + blob);
  				var reader = new window.FileReader();
				reader.readAsDataURL(blob); 
				reader.onloadend = function() {
	                var base64data = reader.result;
	                if (maxWidth != undefined) {
		                resizeImage(base64data, maxWidth, function(dataUrl) {
							deferred.resolve(dataUrl);	                	
		                });
	            	} else {
	            		deferred.resolve(base64data);
	            	}
				}
    		});
			return deferred.promise;
		}

		return {
			getImage: function(url, maxWidth) {
				return getImage(url, maxWidth);
			},
			getChromeLocallyStoredImage: function(url, maxWidth) {
				var deferred = $q.defer();

				var area = chrome.storage.local; // change this to chrome.storage.sync for sync capabilities
			
		        area.get(url, function(value) {
		        	var keyValue = value[url];
		        	if (keyValue == undefined || keyValue == null) {
		        		getImage(url, maxWidth).then(function(data) {
		        			keyValue = data;
		        			// console.log("caching value for "+ key + " : " + angular.toJson(keyValue));
		        			var saveObject = {};
		        			saveObject[url] = keyValue;
		        			// cachedImages[url] = keyValue;
		        			area.set(saveObject, function() {
		        				if (chrome.runtime.lasterror){
						            console.error(chrome.runtime.lasterror.message);
						        } else {
				    				// console.log('saved ' + keyValue + " to key " + key);
				    			}
		        			});
		        			deferred.resolve(keyValue);
		        		});
		        	} else {
			        	deferred.resolve(keyValue);
			        }
		        });
				return deferred.promise;
			},
			getHtml5StoredImage: function(url, maxWidth) {
				var deferred = $q.defer();
				
				var keyValue = localStorage.getItem(url);
				if (keyValue != null) {
					deffered.resolve(keyValue);
				} else {
					getImage(url, maxWidth).then(function(data) {
		        			keyValue = data;
		        			// console.log("csaveItemaching value for "+ key + " : " + angular.toJson(keyValue));
		        			localStorage.setItem(url, keyValue);
		        			deferred.resolve(keyValue);
		        		});
				}
				return deferred.promise;
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
	        	chromeImageStorage.getChromeLocallyStoredImage($scope.dataSrc, $scope.maxWidth).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	.directive("html5StoredImg", function(){
	    return {
	        restrict: "E",
	        scope: {dataSrc: '@ngUrl',
	    			maxWidth: '@maxWidth'},
	        template: '<img ng-src="{{storedImage}}"/>',
	        controller: ['$scope', '$timeout', 'chrome-image-storage', '$element',function($scope, $timeout, chromeImageStorage, $element){
	        	$scope.storedImage = null;
	        	chromeImageStorage.getHtml5StoredImage($scope.dataSrc, $scope.maxWidth).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	;
