(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: OoyalaMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL : "./assets/feed_master.json",
        displayButtons:false 
    };

    var app = new App(settings);
    exports.app = app;
}(window));
