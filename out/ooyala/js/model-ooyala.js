/* Model
 *
 * Model for Ooyala data 
 * This module handles ajax requests for Ooyala content, as well as data transformation
 * and management for the application.
 *
 * This model works with Ooyala FireTV-formatted content. For more information
 * on formatting your Ooyala content for youre FireTV web application, please refer
 * to our Ooyala partner guide in the docs directory.
 *
 * Ooyala Feed Structure - The feeds that work with this model will include a single master
 * feed that contains all the skeleton data for an application. Within the master feed there
 * will be an array of objects which may contain categories with content items, subcategories or a combination 
 * of both. Categories as well as subcategories will contain specific feeds that contain the data for a 
 * particular category or subcategory
 *
 * EXAMPLE :
 * feeds: [{
 *     category: "Category Name",
 *     subcategory: [{
 *         title: "Title of content",
 *         imgURL: "http://cf.c.ooyala.com/...",
 *         feedURL: "http://cdn-api.ooyala.com/v2/syndications/...",
 *         description: "Description text",
 *     }]
 * }]
 *
 * App Content Data Structure - The app uses the following data object to display content :
 * Note : Ooyala Fire TV-formatted data will already be in the needed format for the app
 * {
 *  title    //Title of the content
 *  pubDate  //Publish or release date
 *  thumbURL //thumbnail image for the content - shown in a popup as "Next Up" content
 *  imgURL   //larger image for the content - shown in main UI
 *  videoURL //URL for the video
 * }
 *
 * Module Structure - This module will make requests for feeds as needed and pass the
 * data back to the main app module. To handle requests there is a single method called
 * 'makeGetRequest' which is called. This module receives two parameters - the url for 
 * the request and a context object will be passed on to the success or failure callback.
 * There is a 'successCallbackHandler' method that will handle all successful requests, and
 * a 'errorCallbackHandler' which handles all failed requests. Both will receive the context
 * object that is created by the calling method, this object will tell the method what to
 * do with the data and what callbacks to call.
 * For details on the context object see the comments below for the 'makeGetRequest' method
 *
 * Persistent Data - This model contains the option to store feed data for future use. This
 * is specifically for the case of a broken feed. If a user has used the app, and a feed
 * has been previously fetched, we will store it in localStorage so that if a future request
 * has a problem it can access the stored feed without failing. This is optional, and can be 
 * turned off by changing the 'persistData' flag to false.
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    // {Object} appSettings are the user-defined settings from the index page
    function OoyalaMediaModel(appSettings) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['error']);

        this.persistData = true;

        this.mediaData       = [];
        this.categoryData    = [];
        this.categoryFeedUrl = [];
        this.subcategoryData = {};
        this.currData        = [];
        this.currSubcatName    = undefined;
        this.currCategoryIndex = 0;
        this.currentItem     = 0;
        this.defaultTheme    = "default";
        this.maxLimitReached = false;

        this.MAX_RESULTS_PER_CATEGORY = 50;
        this.MAX_DEFAULT_CATEGORIES = 20;
        this.MAX_SUBCATEGORIES = 20;

        this.KEY_FEED_PREFIX = "storageKey_";
        this.KEY_MASTER_FEED = this.KEY_FEED_PREFIX + "masterFeed";

       /**
        * This function loads the initial data needed to start the app and
        * calls the provided callback with the data when it is fully loaded
        * @param {function} dataLoadedCallback app callback handler 
        */
       this.loadInitialData = function (dataLoadedCallback) {
           var contextObj = {"key" : this.KEY_MASTER_FEED, "successCallback" : this.handleJsonData, "completeCallback" : dataLoadedCallback};
           this.makeGetRequest(appSettings.dataURL, contextObj, this.initialFeedErrorCallbackHandler);
       };

      /*******************************
       *
       * Success/Fail callbacks
       *
       *******************************/
      /**
       * Success Callback Handler 
       * @param {Object} data the data returned from the request
       * @param {Object} ctxObject the context object for handling the data 
       * @param {String} ctxObject.key the key for localStorage data (if turned on)
       * @param {Function} ctxObject.successCallback the method that will handle 
       *                 the data in the model
       * @param {Object} ctxObject.contextData additional data for the handler
       * @param {Function} ctxObject.completeCallback callback method from the application
       */
       this.successCallbackHandler = function(data, ctxObj) {
           if(this.persistData && ctxObj.key) {
               this.setLocalStorageItem(ctxObj.key, data); 
           } 
           ctxObj.successCallback(data, ctxObj.completeCallback, ctxObj.contextData);
       }.bind(this);

      /**
       * Initial Error Callback Handler
       * @param {Object} jqXHR The jQuery XMLHttpRequest object returned by the ajax request
       * @param {String} textStatus status of the ajax request
       */
       this.initialFeedErrorCallbackHandler = function(jqXHR, textStatus) {
           switch (textStatus) {
               case "timeout" :
                   this.trigger("error", ErrorTypes.INITIAL_FEED_TIMEOUT, errorHandler.genStack());
                   break;
               case "parsererror" :
                   this.trigger("error", ErrorTypes.INITIAL_PARSING_ERROR, errorHandler.genStack());
                   break;
               default :
                   this.trigger("error", jqXHR.status ? ErrorTypes.INITIAL_FEED_ERROR : ErrorTypes.INITIAL_NETWORK_ERROR, errorHandler.genStack());
                   break;
           }
       }.bind(this);

      /**
       * Category Error Callback Handler
       * @param {Object} jqXHR The jQuery XMLHttpRequest object returned by the ajax request
       * @param {String} textStatus status of the ajax request
       */
       this.categoryErrorCallbackHandler = function(jqXHR, textStatus) {
           switch (textStatus) {
               case "timeout" :
                   this.trigger("error", ErrorTypes.CATEGORY_FEED_TIMEOUT, errorHandler.genStack());
                   break;
               case "parsererror" :
                   this.trigger("error", ErrorTypes.CATEGORY_PARSING_ERROR, errorHandler.genStack());
                   break;
               default :
                   this.trigger("error", jqXHR.status ? ErrorTypes.CATEGORY_FEED_ERROR : ErrorTypes.CATEGORY_NETWORK_ERROR, errorHandler.genStack());
                   break;
           }
       }.bind(this);

      /**
       * Subcategory Error Callback Handler
       * @param {Object} jqXHR The jQuery XMLHttpRequest object returned by the ajax request
       * @param {String} textStatus status of the ajax request
       */
       this.subCategoryErrorCallbackHandler = function(jqXHR, textStatus) {
           switch (textStatus) {
               case "timeout" :
                   this.trigger("error", ErrorTypes.SUBCATEGORY_TIMEOUT, errorHandler.genStack());
                   break;
               case "parsererror" :
                   this.trigger("error", ErrorTypes.SUBCATEGORY_PARSING_ERROR, errorHandler.genStack());
                   break;
               default :
                   this.trigger("error", jqXHR.status ? ErrorTypes.SUBCATEGORY_ERROR : ErrorTypes.SUBCATEGORY_NETWORK_ERROR, errorHandler.genStack());
                   break;
           }
       }.bind(this);

      /**
       * Handles all get requests for this module
       * @param {String} dataUrl the URL for the request
       * @param {Object} ctxObject the context object for handling the data 
       * @param {String} ctxObject.key the key for localStorage data (if turned on)
       * @param {Function} ctxObject.successCallback the method that will handle 
       *                 the data in the model
       * @param {Object} ctxObject.contextData additional data for the handler
       * @param {Function} ctxObject.completeCallback callback method from the application
       * @param {Function} errorCallback the callback method that will handle errors
       */
       this.makeGetRequest = function (dataUrl, ctxObj, errorCallback) {
           utils.ajaxWithRetry({
                url: dataUrl,
                type: 'GET',
                crossDomain: true,
                dataType: 'json',
                context : this,
                cache : true,
                success:function() {
                    var contentData = arguments[0];
                    this.successCallbackHandler(contentData, ctxObj);
                }.bind(this),
                error:function(jqXHR, textStatus) {
                    if(this.persistData) {
                        if(ctxObj.key) {
                            var data = this.getLocalStorageItem(ctxObj.key);
                            if (data && data.length) {
                                ctxObj.successCallback(data, ctxObj.completeCallback, ctxObj.contextData);
                            } else {
                                errorCallback(jqXHR, textStatus);
                            }
                        }
                        else {
                            errorCallback(jqXHR, textStatus);
                        }
                    }
                    else {
                        errorCallback(jqXHR, textStatus);
                    }
                }.bind(this)
           });
       };

      /**
       * Handles requests that contain json data
       * @param {Object} jsonData data returned from request
       * @param {Function} dataLoadedCallback the application callback handler
       */
       this.handleJsonData = function (jsonData, dataLoadedCallback) {
           this.categoryData = [];
           this.currCategoryIndex = 0;
           this.categoryFeedUrl =[];

           var mediaCats = jsonData.feeds || jsonData.Feeds;
           if (mediaCats) {
               for (var j = 0; j < mediaCats.length && j < this.MAX_DEFAULT_CATEGORIES; j++) {
                   if (this.categoryData.indexOf(mediaCats[j].category) < 0) {
                       var cat = mediaCats[j];
                       this.categoryData.push(cat.category);

                       if(cat.subcategory) {
                           this.subcategoryData[cat.category] = [];

                           // create left nav based on the folder stucture object
                           for (var i = 0; i < cat.subcategory.length && i < this.MAX_SUBCATEGORIES; i++) {
                               //add the subcategory flag
                               cat.subcategory[i].type = "subcategory";
                               this.subcategoryData[cat.category].push(cat.subcategory[i]);
                           }
                       }
                       else {
                           this.categoryFeedUrl.push(mediaCats[j].categoryFeed);
                       }
                   }
               }
           }
           dataLoadedCallback();

        }.bind(this);

       /***************************
        *
        * Utilility Methods
        *
        ***************************/
       /**
        * Sort the data array alphabetically
        * This method is just a simple sorting example - but the
        * data can be sorted in any way that is optimal for your application
        * @param {Array} arr the array to sort
        */
        this.sortAlphabetically = function (arr) {
            arr.sort();
        };

       /**
        * Save the feed in local storage in case we have a problem
        * with the feed in the future
        * @param {String} key the key to use for the localStorage item
        * @param {String} val the value of the localStorage item
        */
        this.setLocalStorageItem = function(key, val) {
            localStorage.setItem(key, JSON.stringify(val));
        };

       /**
        * Retrieve feed from local storage
        * @param {String} key the key of the localStorage item
        */
        this.getLocalStorageItem = function(key) {
            var storedFeed = {};

            if(localStorage.getItem(key)) {
                storedFeed = localStorage.getItem(key);
                storedFeed = JSON.parse(storedFeed);
            }

            return storedFeed;
        };

       /***************************
        *
        * Media Data Methods
        *
        ***************************/
        /**
         * For single views just send the whole media object
         */
         this.getAllMedia = function () {
             return mediaData;
         };

       /***************************
        *
        * Category Methods
        *
        ***************************/
        /**
         * Hang onto the index of the currently selected category
         * @param {Number} index the index into the categories array
         */
         this.setCurrentCategory = function (index) {
             this.currCategoryIndex = index;
         };

        /**
         * Function to set the current subcategory object, this be used to return the subcategory resuts in the getSubCategory method
         * which can be modified in the model before being returned asynchrounously if the model wishes.
         * @param {Object} data currently selected subcategory object
         */
         this.setCurrentSubCategory = function(data) {
            this.currSubCategory = data;
         };

       /***************************
        *
        * Content Item Methods
        *
        ***************************/
        /**
         * Return the category items for the left-nav view
         */
         this.getCategoryItems = function () {
             return this.categoryData;
         };

        /** 
         * Get and return data for a selected category
         * @param {Function} categoryCallback method to call with returned requested data
         */  
         this.getCategoryData = function (categoryCallback) {
              var currCat;
              this.currData = [];
              if(Object.keys(this.subcategoryData).length === 0 ) {
                  this.getContentData(categoryCallback);
              } 
              else {
                  categoryCallback(this.subcategoryData[this.categoryData[this.currCategoryIndex]]);
              }
         }; 

       /**
        * Get content data for a particular category
        * @param {String} pageURL the request URL
        * @param {Function} categoryCallback callback to send data to
        */
        this.getContentData = function (categoryCallback) {
            var key = this.categoryData[this.currCategoryIndex];
            var reqUrl = this.categoryFeedUrl[this.currCategoryIndex];
            var contextObj = {"key" : this.KEY_FEED_PREFIX + key, "successCallback" : this.buildCurrentDataArray, "completeCallback" : categoryCallback};

            this.makeGetRequest(reqUrl, contextObj, this.categoryErrorCallbackHandler);
        };

       /**
        * Handle the data that comes back from the request for the category content items
        * @param {String} jsonData data request response data
        * @param {Function} completeCallback callback handler for the app
        * @param {Object} contextData additional data for the method
        */
        this.buildCurrentDataArray = function (jsonData, completeCallback, contextData) {
            this.currData  = [];
            this.mediaData = jsonData.media;                

            for (var i = 0; i < this.mediaData.length; i++) {
                if(this.mediaData[i].pubDate) {
                    this.mediaData[i].pubDate = exports.utils.formatDate(this.mediaData[i].pubDate);
                }
                this.currData.push(this.mediaData[i]);
                if (this.currData.length >= this.MAX_RESULTS_PER_CATEGORY) {
                    break; // stop adding videos when we hit our limit
                }
            }     

            if(contextData) {
               contextData.contents = this.currData;
            } 
            else {
               contextData = this.currData;
            }

            completeCallback(contextData);
            
        }.bind(this);

        /**
         * Get and return full contents objects for a given folder
         * @param {object} folder object to find contents for
         */
         this.getFullContentsForFolder = function(folder) {
             var i, j, contents = [], currContents = folder.subcategory;
             for (i = 0; i < currContents.length; i++) {
                 if (currContents[i].subcategory) {
                     for (j = 0; j < this.folders.length; j++) {
                         if (this.folders[j].id === currContents[i].id) {
                             this.folders[j].type = "subcategory";
                             contents.push(this.folders[j]);
                         }
                     }
                 }
                 else if (currContents[i].feedURL) {
                     currContents[i].type = 'subcategory';
                     contents.push(currContents[i]);
                 }
                 if (contents.length >= this.MAX_SUBCATEGORIES) {
                     break; // stop adding subcategories when we hit our limit
                 }
             }
             return contents;
         };

        /**
         * Get and return data for a selected sub category, modified however the model wishes. Uses an asynchrounous callback to return the data.
         * @param {Function} subCategoryCallback method to call with returned requested data
         */ 
         this.getSubCategoryData = function(subCategoryCallback) {
             // clone the original object
             var returnData = JSON.parse(JSON.stringify(this.currSubCategory));

             if(returnData.subcategory) {
                 this.currSubcatName = returnData.title;
                 returnData.contents = this.getFullContentsForFolder(this.currSubCategory);
                 subCategoryCallback(returnData);
             }
             else {
                 var key = this.categoryData[this.currCategoryIndex] + "_" + this.currSubcatName + "_" + returnData.title;
                 var reqUrl = returnData.feedURL; 
                 var contextObj = {"key" : this.KEY_FEED_PREFIX + key, "successCallback" : this.buildCurrentDataArray, "contextData" : returnData, "completeCallback" : subCategoryCallback};
                 this.makeGetRequest(reqUrl, contextObj, this.subCategoryErrorCallbackHandler);
             }
         };

       /**
        * Store the refrerence to the currently selected content item
        * @param {Number} index the index of the selected item
        */
        this.setCurrentItem = function (index) {
            this.currentItem = index;
            this.currentItemData = this.currData[index];
        };

       /**
        * Retrieve the reference to the currently selected content item
        */
        this.getCurrentItemData = function () {
            return this.currentItemData;
        };
    };

    exports.OoyalaMediaModel = OoyalaMediaModel;

})(window);


