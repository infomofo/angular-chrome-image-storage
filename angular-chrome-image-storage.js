'use strict';

angular.module("angular-chrome-image-storage",[])
	.factory('chrome-image-storage', function($q, $http){

		/**
		 * A function specifically for retrieving images.
		 * 
		 * The url is converted into a base64 image
		 */ 
		var getImage = function(url) {
			var deferred = $q.defer();
			// console.log(url);
			$http.get(url, {responseType: 'blob'}).success(function(blob) {
  				// console.log('Fetched image via XHR: ' + blob);
  				var reader = new window.FileReader();
				reader.readAsDataURL(blob); 
				reader.onloadend = function() {
	                var base64data = reader.result;                
	                // console.log(base64data );

	    			var keyValue = base64data;
	    			deferred.resolve(keyValue);
				}
    		});
			return deferred.promise;
		}

		return {
			getImage: function(url) {
				return getImage(url);
			},
			getStoredImage: function(url) {
				var area = chrome.storage.local; // change this to chrome.storage.sync for sync capabilities
		
				var deferred = $q.defer();
		        area.get(url, function(value) {
		        	var keyValue = value[url];
		        	if (keyValue == undefined || keyValue == null) {
		        		getImage(url).then(function(data) {
		        			keyValue = data;
		        			// console.log("caching value for "+ key + " : " + angular.toJson(keyValue));
		        			var saveObject = {};
		        			saveObject[url] = keyValue;
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
			}
		}
	})
	.directive("base64Img",function() {
	    return {
	        restrict: "E",
	        scope: {dataSrc: '@ngUrl'},
	        template: '<img ng-src="{{storedImage}}"/>',
	        controller: ['$scope', '$timeout', 'chrome-image-storage', '$element',function($scope, $timeout, chromeImageStorage, $element){
	        	$scope.chromeImageStorage = chromeImageStorage;
	        	$scope.storedImage = null;
	        	chromeImageStorage.getImage($scope.dataSrc).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	.directive("storedImg", function(CSS_CLASSES){
	    return {
	        restrict: "E",
	        scope: {dataSrc: '@ngUrl'},
	        template: '<img ng-src="{{storedImage}}"/>',
	        controller: ['$scope', '$timeout', 'chrome-image-storage', '$element',function($scope, $timeout, chromeImageStorage, $element){
	        	$scope.chromeImageStorage = chromeImageStorage;
	        	$scope.storedImage = null;
	        	chromeImageStorage.getStoredImage($scope.dataSrc).then(function(data) {
	        		$scope.storedImage = data;
	        	});
	        }],
	        replace: true
	    }
	})
	;
