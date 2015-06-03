## Ooyala Project Overview
---------------------------
The Web App Starter Kit supports making a Web App based on your existing Ooyala content. 

## Test Ooyala Sample Project
-----------------------------
The Ooyala example is in the src/projects/ooyala directory. You can quickly get this project up and running on Fire TV by following these steps:

###Testing on Fire TV as a Packaged App

Create a zip package with the sample Ooyala app that can be found in `out/ooyala/` directory. This is just a standard zip, but the index.html must be at the top level of the zip directory - so that there if you unzip the package there is no folder. 

    EXAMPLE :
    - index.html
    - assets/
    - firetv.css
    - js/

    THIS WILL NOT WORK : 
    - folder/
        - index.html
        - assets/
        - firetv.css
        - js/

**NOTE: the sample project uses a feed from a JSON file**
 
After this you can test your app by following the instructions below : 

 * Install the Amazon Web App Tester on your Fire TV device. The web app tester can be found by searching through the app store on the Fire TV or you can do a Voice Search to find the app. 
 * Make sure your FireTV device and your desktop are on the same network
 * Launch the WAT (Web App Tester) on your FireTV 
 * In the landing page for the WAT on the top right there are selections for "Test Hosted App" or "Test Packaged App" - Select the "Test Packaged App"
 * There are two ways to point to a package in the WAT. Type in a URL that points to a .zip file containing your app or sideload your .zip file to the /sdcard/amazonwebapps directory on the host device. More information can be found in our online developer docs for [Installing and Using the Amazon Web App Tester](https://developer.amazon.com/public/solutions/platforms/webapps/docs/tester.html).
 * For a package that was pushed to the 'amazonwebapps' folder, in the WAT select the "Sync" option in the web app tester to show the package in the list.
 * Select "Verify" next to the package name and the WAT will make sure the package is valid. You will then be able to test your application by selecting the "Test" option.

###Testing on Fire TV as a Hosted App or in a Browser
You can also test your app on Fire TV as a hosted app or in a browser by following the steps  shown in the [Testing and Submission](./testingAndSubmission.md) documentation. 

## Customizing the Ooyala Project
------------------

To get your content ready for Fire TV, a few things will need to be done in your Ooyala backlot account. First you need to know the categories of videos that you want in the application; the categories will appear in the left navigation menu. Next, for each category, you need to create a feed URL for the content in that category; this feed is referred to as a [category feed](#category-feed) in the feed structure description below. The content will then be run through a liquid script template to produce the data that will be used in the final app. Third, you need to create a feed that returns the list of categories; this feed is referred to as a [master feed](#master-feed) in the feed structure description below. 

Detailed information about this process can be found with the [Ooyala support documentation for Amazon Fire TV Integration](http://support.ooyala.com/developers/documentation/concepts/amazon_fire_tv_integration.html). 

You should now have the Master Feed URL for your content, and are ready to build your application.
 
To build your Ooyala app you need to modify the `init.js` file. In the `init.js` file you will find a settings object similar to:
 
    //initialize the app
    var settings = {
        Model: OoyalaMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL : "./assets/feed_master.json"
    };
 
Change the dataURL to point to your Master Feed.

###Theming
 
There is a firetv.scss file that resides in the ooyala project directory. You can add custom variables and styles to this file. For more information on theming see our [styling documentation](./styling.md)
 
###Build and Test 
 
For detailed information on building your project refer to [building documentation](./building.md).
 
After updating your `dataURL` reference and making any theming changes, run `gulp build`.
 
Follow the steps described in the [Testing and Submission](./testingAndSubmission.md) documentation to test your app.
 
## Feature Support
----------------------
* Support for Live Streaming and VOD content 
* Support for multiple levels of subcategories
 
## Ooyala Project Architecture
------------------

### Feed Structure

There are two types of feeds: master feed and category feed.

<a name="master-feed"></a>
#### Master Feed

Below is a sample master feed. The call to get the master feed is made when the app is first loaded. The master feed will contain all main category items (shown in the example with the label `title`). A category without subcategories will contain a feedURL item at the top level. This feedURL, when called, will return all the content items for the category. Subcategory items will have a title, description, imageURL and feedURL. The imageURL is a content image that will be displayed in the UI to represent the subcategory, and the feedURL is the feed that will contain all the subcategory content items.

    {  
        "feeds": [  
            {
             "id":"1234",
             "title":"Category One",
             "description":"All series in our catalog",
             "imgURL":"example.com/1.jpg",
             "feedURL":"Category_URL",
             "subcategory":[  
                {  
                   "title":"Subcategory One",
                   "description":"TV show",
                   "imgURL":"example.com/2.jpg",
                   "feedURL":"Subcategory_URL"
                }]
           },
           {
             "category": "Category 1",
             "categoryFeed": "assets/feed_single.json"
           },
           {
              "category": "Category 2",
              "categoryFeed": "assets/feed_single.json"
           }]
    }

<a name="category-feed"></a>
#### Category Feed

Below is a sample data set which would be returned from a feedURL for a category or subcategory. The imageURL is displayed in the UI to represent the content. The thumbURL is used for the app's continuous play feature that shows up on the overlay. For more information on continuous play see our [architecture documentation](./architecture.md)

    {
        "media": [
            {
               "id": "1234",
               "title": "Content Item",
               "pubDate": "2015-05-04T13:37:58Z",
               "thumbURL":"example.com/2Thumb.jpg",
               "imgURL":"example.com/2.jpg",
               "videoURL": "Video_URL",
               "description": "Information describing the content"
            }]
    }

## App Submission
-----------------------------
See the [Testing and Submission](./testingAndSubmission.md) documentation for information on submitting your application.
 
## Developer Support
----------------------------
For issues with Ooyala contact Ooyala Technical Support or your account manager. This includes:

* Playlists/Content Issue
* Video Playback Issues

For issues with the Ooyala sample project leave your comments here. This includes:

* Unknown JavaScript errors
* Features not working as expected
