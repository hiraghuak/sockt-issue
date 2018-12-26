/*
 * Copyright (C) Saranyu Technologies - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by :  BHARATH S N <bharath@saranyu.in>, Year 2016
 * Team Members : Harinandan , Bharath , Uday
 * License: contact mkt@saranyu.in

 * File Description : Saranyu HLS MSE Player JS
*/

/*
 * JS Architecture
 *
 * Used "Pseudo-classical pattern" in JS
 *
*/

var SaranyuHlsHTML5Player = SaranyuHlsHTML5Player || {} ;
SaranyuHlsHTML5Player.version = '0.0.1';
SaranyuHlsHTML5Player.players = [];
SaranyuHlsHTML5Player.PLUGIN_NAME = "Saranyu HLS Video Player";
SaranyuHlsHTML5Player.debug = true;
SaranyuHlsHTML5Player.inActivityTimeout = 3000;//in ms
SaranyuHlsHTML5Player.googleImaSDKURL = "//imasdk.googleapis.com/js/sdkloader/ima3.js";
SaranyuHlsHTML5Player.googleImaSDKLoaded = false;
SaranyuHlsHTML5Player.maxNonLinearAdHeight = 150;
SaranyuHlsHTML5Player.bigPlayClickCounter = 0;
SaranyuHlsHTML5Player.bigPlayClickDELAY = 350;
SaranyuHlsHTML5Player.bigPlayClickCounterTimer;

SaranyuHlsHTML5Player.defaultOptions = {
		'debug' : 'true', //flag to check if //console.log to print or not
		'type' : 'video', //if content is video (most obviously in this application its video)
		'autoplay' : "true", //to play content automatically without user interaction (issue with mobile phone which limits autoplay natively).
		'videotitle' : "", //video title to appear in top control bar
		'content' : 'vod',//if content is vod , elseif live , elseif livedvr
		'maintainaspect' : 'true',// to maintain aspect ratio or fit to screen of <video>
		'titleStrings' : { // on hover above icon we will show tooltip, default string of those tooltip are listed here
			'pause' : "Pause",
			'play' : "Play",
			'replay' : "Replay",
			'fullscreenText' : "Full Screen",
			'unFullscreenText' : "Exit Fullscreen",
			'muteText' : "Mute",
			'unmuteText' : "Unmute",
			'socialShare' : "Share",
			'download' : "Download",
			'watchLater' : "Watch Later",
			'favourite' : "Favourite",
			'videotitle' : 'VideoTitle',
			'swap' : 'Swap',
			'guide' : 'Guide',
			'like' : 'Like',
			'record' : 'Record',
			'stop' : 'Stop',
			'light' : 'Light',
			'playlist' : 'Playlist',
			'multiaudio' : 'Default',
			'subtitles' : 'OFF'
		},
};

SaranyuHlsHTML5Player.Utils = { //some of usual utility functions are listed here

		// conditional console logging
		DLOG : function() {
			if (!SaranyuHlsHTML5Player.debug)
				return;
			//console.log(SaranyuHlsHTML5Player.PLUGIN_NAME + ': ', arguments);
		},

		//converts seconds to hh:mm:ss , limitation for proper result use only (0-86399)
		secondsToTimeCode : function(time, forceHours, showFrameCount, fps) {

			if (typeof showFrameCount == 'undefined') {
				showFrameCount = false;
			} else if (typeof fps == 'undefined') {
				fps = 25;
			}

			//structuring the response in better readable string
			var hours = Math.floor(time / 3600) % 24, minutes = Math
				.floor(time / 60) % 60, seconds = Math.floor(time % 60), frames = Math
				.floor(((time % 1) * fps).toFixed(3)),

				hours = ((isNaN(hours)) ? 0 :hours);
				minutes = ((isNaN(minutes)) ? 0 :minutes);
				seconds = ((isNaN(seconds)) ? 0 :seconds);

				result = ((forceHours || hours > 0) ?
						(hours < 10 ? '0' + hours : hours)+ ':' : '')
						+ (minutes < 10 ? '0' + minutes : minutes)
						+ ':'
						+ (seconds < 10 ? '0' + seconds : seconds)
						+ ((showFrameCount) ? ':'
						+ (frames < 10 ? '0' + frames : frames) : '');

				return result;
		},
		//convert timecode to seconds
		timeCodeToSeconds : function(time, forceHours, showFrameCount, fps) {

			if (typeof showFrameCount == 'undefined') {
				showFrameCount = false;
			} else if (typeof fps == 'undefined') {
				fps = 25;
			}

			if(time)

			if(time){
				var timeAry=time.split(":");
				var totalSecs=0;
				if(timeAry.length==3){
					var hr=Number(timeAry[0]);
					var min=Number(timeAry[1]);
					var sec=Number(timeAry[2]);
					totalSecs=(hr*60*60)+(min*60)+(sec);
				}
				else if(timeAry.length==2){
					var min=Number(timeAry[0]);
					var sec=Number(timeAry[1]);
					totalSecs=(min*60)+(sec);
				}
			}else{
				var totalSecs = 0;
			}
				return totalSecs;
		},
		//get width in percentage
		getWidthInPercentage : function(child){
				var parent = child.parent();
				return ((child.width()/parent.width()) * 100).toFixed(0) + "%";
		},
		//get height in percentage
		getHeightInPercentage : function(child){
				var parent = child.parent();
				return ((child.height()/parent.height()) * 100).toFixed(0) + "%";
		},
		//when mouse move we can see text being selected , below utility function will disable such
		preventSelectionOfTextInMouseMove : function(e){
			 if(e.stopPropagation) e.stopPropagation();
			    if(e.preventDefault) e.preventDefault();
			    e.cancelBubble=true;
			    e.returnValue=false;
			    return e;
		},
		getPercentageForGivenDuration : function(time,duration){
			return ((time/duration)*100);
		}
	};

SaranyuHlsHTML5Player.MediaFeatures = { //media features flags which is used in code to make logical conclusion.
		init : function() {
			var t = this,
				nav = window.navigator,
				ua = navigator.userAgent.toLowerCase(),
				i, v = null,
				html5Elements = [ 'source', 'track','audio', 'video' ];

			// detect browsers (only the ones that have some kind of quirk we need
			// to work around)

			/*function isSupportedMSE() {
				window.MediaSource = window.MediaSource || window.WebKitMediaSource;
				return (window.MediaSource &&
						typeof window.MediaSource.isTypeSupported === 'function' &&
						window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'));
			 }



			 function checkHLS() {
				 if( navigator.userAgent.match(/Android/i)
				 || navigator.userAgent.match(/webOS/i)
				 || navigator.userAgent.match(/iPhone/i)
				 || navigator.userAgent.match(/iPad/i)
				 || navigator.userAgent.match(/iPod/i)
				 || navigator.userAgent.match(/BlackBerry/i)
				 || navigator.userAgent.match(/Windows Phone/i)
				 )
				 {
					return true;
				 }
				 return false;
			 }*/
			// SaranyuHlsHTML5Player.Utils.DLOG("check Media sourse", isSupportedMSE() + "- -"+checkHLS());
			/*t.isiPad = (ua.match(/ipad/i) !== null);
			t.isiPhone = (ua.match(/iphone/i) !== null);
			t.isiOS = t.isiPhone || t.isiPad;
			t.isAndroid = (ua.match(/android/i) !== null);
			t.isBustedAndroid = (ua.match(/android 2\.[12]/) !== null);
			t.isBustedNativeHTTPS = (location.protocol === 'https:' && (ua
					.match(/android [12]\./) !== null || ua
					.match(/macintosh.* version.* safari/) !== null));
			t.isIE = (nav.appName.toLowerCase().indexOf("microsoft") != -1);
			t.isChrome = (ua.match(/chrome/gi) !== null);
			t.isFirefox = (ua.match(/firefox/gi) !== null);
			t.isWebkit = (ua.match(/webkit/gi) !== null);
			t.isGecko = (ua.match(/gecko/gi) !== null) && !t.isWebkit;
			t.isOpera = (ua.match(/opera/gi) !== null);
			t.hasTouch = ('ontouchstart' in window);
			t.supportsMSE = ('MediaSource' in window);

			// borrowed from Modernizr
			t.svg = !!document.createElementNS
					&& !!document.createElementNS('http://www.w3.org/2000/svg',
							'svg').createSVGRect;

			// create HTML5 media elements for IE before 9, get a <video> element
			// for fullscreen detection
			for (i = 0; i < html5Elements.length; i++) {
				v = document.createElement(html5Elements[i]);
			}

			t.supportsMediaTag = (typeof v.canPlayType !== 'undefined' || t.isBustedAndroid);

			// Fix for IE9 on Windows 7N / Windows 7KN (Media Player not installer)
			try {
				v.canPlayType("video/mp4");
			} catch (e) {
				t.supportsMediaTag = false;
			}*/




		}
	};
SaranyuHlsHTML5Player.MediaFeatures.init(); //invoked this function to gather fresh info of browser capacities



SaranyuHlsHTML5Player.MediaPlayer = function (element, options, playerType){
	SaranyuHlsHTML5Player.Utils.DLOG("Constructor", element, options);

	var t = this;
	t.masterElementid = element;
	t.options = options;
	t.playerType=playerType;


	t.$masterContainer = $(element);

	// Input Parameter validation
	t._validateParams(options);
	//alert("sphls playerType:"+playerType);
	t.init();
};

SaranyuHlsHTML5Player.MediaPlayer.prototype = {
		// check for some of important parameters, like valid file is present or not
		_validateParams : function(options) {
			if (options['type']) {
				SaranyuHlsHTML5Player.Utils.DLOG("Media Type present. Check if its valid");
				if ($.inArray(options['type'], SaranyuHlsHTML5Player.MediaTypes) > -1) {
					SaranyuHlsHTML5Player.Utils.DLOG("Valid Media Types");

					if (options['file']) {
						SaranyuHlsHTML5Player.Utils.DLOG("File Info Present");

					} else {
						SaranyuHlsHTML5Player.Utils.DLOG("File Information Not present");
					}

				} else {
					SaranyuHlsHTML5Player.Utils.DLOG("Unknown Media Type");
				}

			} else {
				SaranyuHlsHTML5Player.Utils.DLOG("Media Type Not present");
			}

		},

		init : function(){
			var t = this;
			SaranyuHlsHTML5Player.Utils.DLOG("Init Function", t, t.options, t.$masterContainer);

				// build container with basic skeleton elements
				t.container = $('<div class="sp-main-container-wrapper">'
								+'<div class="sp-main-container">'
									+'<div class="sp-player-inner">'

										+'<div class="sp-ad-container"></div>'
										+'<div class="sp-media-element"></div>'
										+'<div class="sp-player-layers"></div>'
										+'<div class="sp-full-controls"></div>'

									+'</div>'
								+'</div>'
						+'</div>').appendTo(t.$masterContainer);

				t.mainContainerWrapper = t.container.find('.sp-main-container-wrapper');
				t.mainContainer = t.container.find('.sp-main-container');
				t.playerInner = t.container.find('.sp-player-inner');
				t.adContainer = t.container.find('.sp-ad-container');
				t.mediaElement = t.container.find('.sp-media-element');
				t.playerLayers = t.container.find('.sp-player-layers');
				t.fullControls = t.container.find('.sp-full-controls');

				// populate functional elements
				t._createMediaElement(); // create and append <video> to basic skeleton
				t._createFullControls();// create full controls skeleton
				t._createIndividualControls();// create and append controls , attach event listeners


				//if(!isSupportedMSE() && checkHLS()){     //

				//}
				//else{
					t._createAndAppendHLStoPlayer(t.options.file[0]);//create and append HLS
				//}
				t._hideControlsUnderInactivity();// create and append controls , attach event listeners
				t._createCustomContextmenu();
		},


		//these function will be invoked from init() .
		//will append controls icon and attach event listeners
		_createMediaElement : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("_createMediaElement function being called");
			var t = this;
			var mediaElement = t.mediaElement;
			var videoElement =  '<video></video>';
			var userAgent = navigator.userAgent || navigator.vendor || window.opera;

			mediaElement.append(videoElement);
			t.mediaElement.videoElement = mediaElement.find('video')[0];
		},
		_createFullControls : function(){
			var t = this;

			//attaching skeleton inside full controls
			//top controlbar
			//bottom contolbar with progress-bar and bottom player controls
			var topContolbar = '<div class="sp-controls-top"></div>';
			t.fullControls.append(topContolbar);
			t.fullControls.topContolbar = t.fullControls.find('.sp-controls-top');

			var bottomControlBar = '<div class="sp-controls-bottom"></div>';
			t.fullControls.append(bottomControlBar);
			t.fullControls.bottomControlBar = t.fullControls.find('.sp-controls-bottom');

			var bottomProgressBar = '<div class="sp-controls-bottom-progress-bar"></div>';
			t.fullControls.bottomControlBar.append(bottomProgressBar);
			t.fullControls.bottomControlBar.bottomProgressBar = t.fullControls.find('.sp-controls-bottom-progress-bar');

			var bottomPlayerControls = '<div class="sp-controls-bottom-plyr-controls"></div>';
			t.fullControls.bottomControlBar.append(bottomPlayerControls);
			t.fullControls.bottomControlBar.bottomPlayerControls = t.fullControls.find('.sp-controls-bottom-plyr-controls');

			t._createFullControls.hideFullControls = function(){
				t.fullControls.hide();
			try{
				if(t._buildadvertisement.initializeAd.adStarted && !t._buildadvertisement.initializeAd.isLinear){
					t.adContainer.removeClass("sp-playlist-show");
				}
			}catch(e){
			}

			};

			t._createFullControls.showFullControls = function(){
				t.fullControls.show();

				//show banner ads at top
				try{
					if(t.fullControls.playlistPanel.is(':visible')){
						try{
							if(t._buildadvertisement.initializeAd.adStarted && !t._buildadvertisement.initializeAd.isLinear){
							t.adContainer.addClass("sp-playlist-show");
						}
						}catch(e){
						}
					}
				}catch(e){
				}


				//Bug Fix , when time-handle goes out of extreme end when controls are hidden.
				try{
					var media = t.mediaElement.videoElement;
					var percentage = media.currentTime / media.duration;
					t._buildprogressbar.adjustCurrentAndHandleInSeek(percentage);
				}catch(e){
				}

			};
		},
		_createIndividualControls:function(){
			SaranyuHlsHTML5Player.Utils.DLOG("_createcontrols function being called");
			var t = this;
			var features = t.options.features;
			SaranyuHlsHTML5Player.Utils.DLOG("options pass is "+features);
			for (featureIndex in features) {
				feature = features[featureIndex];
				if (t['_build' + feature]) {
					t['_build'+feature]();
				}
			}
		},
		_createAndAppendHLStoPlayer : function(file){
				var t = this;
				var media = t.mediaElement.videoElement;
				var content_url = file.content_url;
				var options = t.options;
				if(!!file.seekonload){
					t.options.seekonload = file.seekonload;
				}else{
					t.options.seekonload = '0';
				}

				if(t.mediaElement.videoElement.hlsObj){
						t.mediaElement.videoElement.hlsObj.destroy();
				}

				t._createAndAppendHLStoPlayer._attachHLStoVideo = function (){
					// destroy older hls if exist
					// Attaching HLS JS to Video Tag, so using MSE it can play hls video
					if(Hls.isSupported()){

					    t.mediaElement.videoElement.saranyuHlsMertics = {};
					    t.mediaElement.videoElement.saranyuHlsMertics.playbackRateOld = media.playbackRate;

					    t.mediaElement.videoElement.hlsObj = new Hls();
					    t.mediaElement.videoElement.hlsObj.loadSource(content_url);
					    t.mediaElement.videoElement.hlsObj.attachMedia(media);

					    // Setting mediaId
					    t.mediaElement.videoElement.mediaId = file.mediaid;

					    // Bug Fix Of PlaybackSpeed resetting to 1, playbackspeed will be retained
					    media.playbackRate = t.mediaElement.videoElement.saranyuHlsMertics.playbackRateOld;

						t.mediaElement.videoElement.hlsObj.on(Hls.Events.MANIFEST_PARSED,function(){
					    	if((options.autoplay === "true") || (options.autoplay === true)){
					    		console.log("hls manifest parsed so play now");
								//alert("manifest parsed"+options.seekonload+Number(options.seekonload));
								  //media.currentTime = 20;
								  var seektime=Number(options.seekonload);
								  var seekTimer;
								  if(seektime>0){
								    //alert("seek now" +seektime);
									//media.currentTime =seektime;
									seekTimer= setTimeout(function(){
										t._videoPlayerControls("seek",seektime);
									}.bind(t),2000);
								  }
								  else{
								    media.play();
                                    t._hideControlsUnderInactivityFirstLaunch();

								  }
								  	//
					    	}

							if(t.options.features.includes('qualityswitch')){
									t._buildqualityswitch._buildQualityPopup(t.mediaElement.videoElement.hlsObj.levels);
							}

					  	});

						t.mediaElement.videoElement.hlsObj.on(Hls.Events.AUDIO_TRACKS_UPDATED,function(event,data) {
							if(t.options.features.includes('multiaudio')){
								t._buildmultiaudio._buildMultiaudioPopup(t.mediaElement.videoElement.hlsObj.audioTracks);
							}
						});


					  	t.mediaElement.videoElement.hlsObj.on(Hls.Events.LEVEL_LOADED,function(event,data) {
							  t.mediaElement.videoElement.saranyuHlsMertics = data.details;
							  t.mediaElement.videoElement.saranyuHlsMertics.islive = data.details.live;
						});



					}else{
					 	SaranyuHlsHTML5Player.Utils.DLOG("MSE (Media Source Extension) is not supported in Your Browser");
					}
				};

				//---dash----------------
				t._createAndAppendHLStoPlayer._attachDashtoVideo = function (){

						if(!t.mediaElement.videoElement.dashObj){
							var protData = {};
							t.mediaElement.videoElement.dashObj = dashjs.MediaPlayer().create();

							// if (document.documentMode || /Edge/.test(navigator.userAgent)) {
							// 	protData['com.microsoft.playready'] = {serverURL: 'https://playready.ezdrm.com/cency/preauth.aspx?pX=2EC6ED'};
							// }else{
							// 	protData['com.widevine.alpha'] = {serverURL: 'https://widevine-dash.ezdrm.com/proxy?pX=B0CBED'};
							// }

							if(file.encryption == 'true'){
								if (document.documentMode || /Edge/.test(navigator.userAgent)) {
									protData['com.microsoft.playready'] = {serverURL: file.la_url};
								}else{
									protData['com.widevine.alpha'] = {serverURL: file.la_url};
								}
								t.mediaElement.videoElement.dashObj.setProtectionData(protData);
							}

							t.mediaElement.videoElement.dashObj.initialize(t.mediaElement.videoElement, content_url, t.options.autoplay);
							t.mediaElement.videoElement.dashObj.setFastSwitchEnabled(true);

							t.mediaElement.videoElement.dashObj.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function () {
									var bitrates = t.mediaElement.videoElement.dashObj.getBitrateInfoListFor("video");
									t.mediaElement.videoElement.dashObj.bitratez = bitrates;
									try{
										t._buildqualityswitch._buildQualityPopup(t.mediaElement.videoElement.dashObj.bitratez);
									}catch(e){
									}

						    	if((t.options.autoplay === "true") || (t.options.autoplay === true)){
						    		console.log("mpd manifest parsed so play now");
									//alert("manifest parsed"+options.seekonload+Number(options.seekonload));
									  //media.currentTime = 20;
									  var seektime=Number(t.options.seekonload);
									  var seekTimer;
									  if(seektime>0){
									    //alert("seek now" +seektime);
										//media.currentTime =seektime;
										seekTimer= setTimeout(function(){
											t._videoPlayerControls("seek",seektime);
										}.bind(t),2000);
									  }
									  else{
									    media.play();
	                                    t._hideControlsUnderInactivityFirstLaunch();
									  }
						    	}

							}.bind(t));

						}else{
							t.mediaElement.videoElement.dashObj.attachSource(file.content_url);
						}
				};


                //alert("load player"+t._isSupportedMSE()+ t._checkHLS());
				if(!t._isSupportedMSE() && t._checkHLS()){     //
					//alert("load only html5 player");
					t.mediaElement.videoElement.src = content_url;
					//t.mediaElement.videoElement.attachMedia(media);

					// Setting mediaId
					t.mediaElement.videoElement.mediaId = file.mediaid;
					media.play();
				}
				else{
						if(t.playerType=="mp4"){
							  t.mediaElement.videoElement.src = content_url;
								// Setting mediaId
								t.mediaElement.videoElement.mediaId = file.mediaid;
							  media.play();
						}
						else if(t.playerType=="hls"){
								t._createAndAppendHLStoPlayer._attachHLStoVideo();
						}
						else if(t.playerType=="mpd"){
						 		t._createAndAppendHLStoPlayer._attachDashtoVideo();
						}
				}

				// Change Title
				try{
					t.fullControls.topContolbar.videoTitle.changeTitle(file.videotitle);
				}catch(e){}

				// Change Poster
				try{
					t.playerLayers.poster.changePoster(file.poster);
				}catch(e){}
				if(t.options.features.includes('subtitles')){
					t._buildsubtitles._buildSubtitlesPopup();
				}
				//this custom trigger to  hide controls when contene starts to play
				t.playerInner.trigger("mousemove");


		},

		_hideControlsUnderInactivityFirstLaunch : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching logic of hiding controls when there is no user interactivity");

			var t = this;
			var media = t.mediaElement.videoElement;
			t.counterToCheckInActivity;


				t._createFullControls.showFullControls()
				clearTimeout(t.counterToCheckInActivity);

				if(t.options.hideControlsWhenInactive=="true"){
					t.counterToCheckInActivity = setTimeout(function() {
						if((t.fullControls.is(":visible")) && (!media.paused)){
							t._createFullControls.hideFullControls();
							SaranyuHlsHTML5Player.Utils.DLOG("hiding controls because there is no user activity from "+SaranyuHlsHTML5Player.inActivityTimeout+" ms");
						}
					}, SaranyuHlsHTML5Player.inActivityTimeout);
				}


		},

		_hideControlsUnderInactivity : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching logic of hiding controls when there is no user interactivity");

			var t = this;
			var media = t.mediaElement.videoElement;
			t.counterToCheckInActivity;

			t.playerInner.on('mousemove mouseenter mouseover',function(event){
				t._createFullControls.showFullControls()
				clearTimeout(t.counterToCheckInActivity);

				if(t.options.hideControlsWhenInactive=="true"){
					t.counterToCheckInActivity = setTimeout(function() {
						if((t.fullControls.is(":visible")) && (!media.paused)){
							t._createFullControls.hideFullControls();
							SaranyuHlsHTML5Player.Utils.DLOG("hiding controls because there is no user activity from "+SaranyuHlsHTML5Player.inActivityTimeout+" ms");
						}
					}, SaranyuHlsHTML5Player.inActivityTimeout);
				}
			}.bind(t,media));

		},
		_createCustomContextmenu : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching custom context menu");

			var t = this;
			/*
				we need to disable right click on player
				and show a popup as saranyu player
				if possible the popup should start from right clicked co-ordinate also taking care
				the width of popup does lie between the boundary of player.
			*/

			t.playerInner.contextmenu(function(e){
				e.preventDefault();
				SaranyuHlsHTML5Player.Utils.DLOG("Right Clicked on player");
				//t.playerLayers.feedbackTextElement.html("Player Developed by <br> Saranyu Technologies Pvt Ltd").stop(false,true).show().fadeOut(3500);
			});
		},

		//independent element attachment
		//play pause icon in bottom controls
		_buildplaypause : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching play pause icon");
			var t = this;
			var media = t.mediaElement.videoElement;

			var saranyuPlaypause = '<div class="sp-button sp-play-pause sp-play"><span class="tooltiptext"></span><button class="sp-play-pause-btn"></button></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(saranyuPlaypause);
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-button.sp-play-pause.sp-play');
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip = t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.find('.tooltiptext');

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.click(function(e){
				//change icon and trigger play pause of video element
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on Play Pause Icon");
				e.preventDefault();
				if(media.paused){
					t._videoPlayerControls("play");
				}else{
					t._videoPlayerControls("pause");
				}
				//uday added on 11-12-2016
				if(media.ended){
					t._videoPlayerControls("seek",0);
				}
				document.activeElement.blur();
				media.focus();
			        //uday added on 11-12-2016
			});

			if(t.options.autoplay === 'false'){
				SaranyuHlsHTML5Player.Utils.DLOG("Autoplay false");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-pause");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-play");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.play);
			}

			//adding event listener for changing icons
			media.addEventListener('play', function() {
				try{
					SaranyuHlsHTML5Player.Utils.DLOG("Play triggered");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-play");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-pause");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.pause);
				}catch(e){
				}
			}, false);

			media.addEventListener('playing', function() {
				try{
					SaranyuHlsHTML5Player.Utils.DLOG("Playing triggered");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-play");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-pause");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.pause);
				}catch(e){
				}
			}, false);

			media.addEventListener('pause', function() {
				try{
					SaranyuHlsHTML5Player.Utils.DLOG("Pause triggered");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-pause");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-play");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.play);
				}catch(e){
				}
			}, false);

			media.addEventListener('ended', function() {
				try{
					SaranyuHlsHTML5Player.Utils.DLOG("Re-Play triggered");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-replay");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-play");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-pause");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.replay);

					//when video ended show the full controls
					t._createFullControls.showFullControls();


					var features = t.options.features;
					for (featureIndex in features) {
						if(features[featureIndex]=="relatedvideo"){
						    //t.options.autoplay=false;
							t.fullControls.relatedPanel.show();
						}
					}
				}catch(e){
				}
			}, false);

		},
		//volume button and volume seek in bottom controls
		_buildvolume : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching volume icon and volume seekbar");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;

			//create and append volume button
			var volumebtn = '<div class="sp-button sp-volume-btn-wrap sp-unmute"><span class="tooltiptext">'+SaranyuHlsHTML5Player.defaultOptions.titleStrings.muteText+'</span><button class="sp-volume-btn"></button></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(volumebtn);
			t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-button.sp-volume-btn-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.tooltip = t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.find('.tooltiptext');

			//create and append volume seekbar
			var volumeSlider = '<div class="sp-volume-slider sp-volume-slider-wrap"><div class="sp-volume-current"></div><div class="sp-volume-handle"><span class="tooltiptext"></span></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(volumeSlider);
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-volume-slider.sp-volume-slider-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeCurrent = t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.find('.sp-volume-current');
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle = t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.find('.sp-volume-handle');
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle.tooltip = t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle.find('.tooltiptext');

			//fill handle tooltip a value
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.writeToVolumeHandleTooltip = function(){
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle.tooltip.html(SaranyuHlsHTML5Player.Utils.getWidthInPercentage(t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeCurrent));
			}

			//align volume current and volume handle
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.positionVolumeHandle = function(volume){
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeCurrent.css("width",volume *100 +"%");
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle.css("left","calc("+volume *100+"% - "+t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.volumeHandle.width() / 2+"px)");
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.writeToVolumeHandleTooltip();
			}

			//get value of volume bar position and change the <video> volume
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.handleVolumeMove = function(e){
				var volume = null,volumeTotal = t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider, totalOffset = volumeTotal.offset();
				var railWidth = volumeTotal.width(), newX = e.pageX - totalOffset.left;
				volume = newX / railWidth;
				volume = Math.max(0, volume);
				volume = Math.min(volume, 1);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.positionVolumeHandle(volume);
				t._videoPlayerControls("volumechange",volume);
			}

			//enter default volume value
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.writeToVolumeHandleTooltip();

			//adding event listener for changing icons
			media.addEventListener('volumechange', function() {
				try{
					SaranyuHlsHTML5Player.Utils.DLOG("volume change triggered");
					if(media.muted){
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.addClass("sp-mute");
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.removeClass("sp-unmute");
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.unmuteText);
						t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.hide();
						t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.writeToVolumeHandleTooltip();
					}else{
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.addClass("sp-unmute");
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.removeClass("sp-mute");
						t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.muteText);
						t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.show();
						t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.writeToVolumeHandleTooltip();
					}
				}catch(e){
				}
			}, false);


			//event listner for volume mute and unmute button
			t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.click(function(e){
				//change icon and trigger play pause of video element
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on voluem button");
				e.preventDefault();
				if(media.muted){
					t._videoPlayerControls("unmute");
				}else{
					t._videoPlayerControls("mute");
				}
			});

			//event listner for volume slider
			t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.bind('mouseover', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.mouseIsOver = true;
			}).bind('mousemove', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.playerInner.trigger("mousemove");
				if (t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.mouseIsDown == true) {
					t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.handleVolumeMove(e);
				}
			}).bind('mouseup', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.mouseIsDown = false;
			}).bind('mousedown', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.handleVolumeMove(e);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.mouseIsDown = true;
			}).bind('mouseleave', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.mouseIsDown = false;
			});


			// if the options have mute then execute this if condition
			if((options.mute === "true") || (options.mute == true)){
				t._videoPlayerControls("mute");
				t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.addClass("sp-mute");
				t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.removeClass("sp-unmute");
				t.fullControls.bottomControlBar.bottomPlayerControls.volumebtn.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.unmuteText);
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.hide();
			}

			if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
				t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.addClass("firefox");
			}

		},
		_buildprogressbar : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching progressbar");
			var t = this;
			var media = t.mediaElement.videoElement;

			var progressbar = '<div class="sp-progress-bar-time-rail"><span class="sp-progress-bar-buffering"></span><span class="sp-progress-bar-loaded"></span><span class="sp-progress-bar-current"></span><span class="sp-progress-bar-cues"></span><span class="sp-progress-bar-handle"></span><span class="sp-progress-bar-timefloat"></span><span class="sp-progress-bar-seekbar-preview"></span></div>';
			t.fullControls.bottomControlBar.bottomProgressBar.append(progressbar);
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-time-rail');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.buffering = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-buffering');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.loaded = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-loaded');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.current = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-current');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-handle');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-timefloat');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-seekbar-preview');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.cues = t.fullControls.bottomControlBar.bottomProgressBar.find('.sp-progress-bar-cues');

			t._buildprogressbar.adjustCurrentAndHandleInSeek = function(percentage){

				if(percentage < 0 || percentage > 1){
					return;
				}

				var percentageWithSpecialChar = percentage * 100+"%";
				var offsets = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.width()/2;
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.current.width(percentageWithSpecialChar);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.css("left","calc("+percentageWithSpecialChar+" - "+offsets+"px)");


				//this code ensures the handle will not go outside the extrement , and lies within
				var thl,thw;
				var ptl,ptw;
				var percentage2 = 0;
				thl = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.offset().left;
				thw = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.width();

				ptl = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.offset().left;
				ptw = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.width();

				if(thl<ptl){
					//if timer handler is outside of extreme left end
					var temp = 0;
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.css('left', temp+"px" );
				}
				else if((thw+thl)>(ptl+ptw)){
					//if timer handler is outside of extreme right end
					var temp;
					temp = ptw - thw;
					percentage2 = temp;
					offsets = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.width();
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.css("left","calc("+percentageWithSpecialChar+" - "+offsets+"px)");
				}


			}
			function showToolTip(e){

				var seekTotal = t.fullControls.bottomControlBar.bottomProgressBar.progressbar, totalOffset = seekTotal.offset();
				var railWidth = seekTotal.width(), pos = e.pageX - totalOffset.left;
				var newTime;

				percentage = (pos / railWidth);
				var percentageWithSpecialChar = percentage * 100+"%";
				newTime = percentage * media.duration;

				if(newTime<0 || newTime>media.duration || isNaN(newTime)){
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.show();
					return;
				}

				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.html(SaranyuHlsHTML5Player.Utils.secondsToTimeCode(newTime));
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.css("left",percentageWithSpecialChar);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.show();

				var tfl,tfw;
				var ptl,ptw;
				var percentage2 = 0;
				tfl = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.offset().left;
				tfw = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.outerWidth();

				ptl = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.offset().left;
				ptw = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.outerWidth();

				if((tfw+tfl)>(ptl+ptw)){
					var temp;
					temp = ptw - tfw;
					percentage2 = temp;
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.css('left', percentage2+"px" );
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.show();
				}

				try{
					if(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData){
						t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.renderingThumbnailPreview(newTime);
						t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.css("left",percentageWithSpecialChar);
						t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.show();

						var sbl,sbw;
						var percentage3 = 0;
						sbl = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.offset().left;
						sbw = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.outerWidth();

						if((sbw+sbl)>(ptl+ptw)){
							var temp2;
							temp2 = ptw - sbw;
							percentage3 = temp2;
							t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.css('left', percentage3+"px" );
							t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.show();
						}

					}
				}catch(e){
				}

			}
			function hideToolTip(){
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.timefloat.hide();
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.hide();
			}

			function handleSeekBarMove(e){
				var seekTotal = t.fullControls.bottomControlBar.bottomProgressBar.progressbar, totalOffset = seekTotal.offset();
				var railWidth = seekTotal.width(), pos = e.pageX - totalOffset.left;
				var newTime;

				percentage = (pos / railWidth);
				newTime = percentage * media.duration;

				if(newTime<0 || newTime>media.duration || isNaN(newTime)){
					return;
				}

				if(media.ended && media.paused){
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-pause");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-play");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.play);
					t.playerLayers.bigreplay.hide();
					t.playerLayers.bigplay.show();
				}

				t._videoPlayerControls("seek",newTime);
				t._buildprogressbar.adjustCurrentAndHandleInSeek(percentage);
				showToolTip(e);

			}

			//event listner for progress bar
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.bind('mouseover', function(e) {
				showToolTip(e);
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.mouseIsOver = true;
			}).bind('mousemove', function(e) {
				showToolTip(e);
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				if (t.fullControls.bottomControlBar.bottomProgressBar.progressbar.mouseIsDown == true) {
					handleSeekBarMove(e);
				}
			}).bind('mouseup', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.mouseIsDown = false;
			}).bind('mousedown', function(e) {
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					handleSeekBarMove(e);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.mouseIsDown = true;
			}).bind('mouseleave', function(e) {
				hideToolTip();
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.mouseIsDown = false;
			});


			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.saranyuHammer({
				drag_max_touches : 0
			}).on("touch drag", function(ev) {
				var touches = ev.gesture.touches;
				ev.gesture.preventDefault();
				showToolTip(ev);
				for ( var i = 0, len = touches.length; i < len; i++) {
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.mouseIsDown = true;
					handleSeekBarMove(touches[i]);
				}
			}).on("release", function(ev) {
				handleSeekBarMove(ev);
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.mouseIsDown = false;
				hideToolTip();
			}).on("mouseleave", function(ev) {
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.handle.mouseIsDown = false;
			});

			function showBufferedData(bufferedMaxTimePercentage){
				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.loaded.width(bufferedMaxTimePercentage*100+"%");
			}

			//attaching event listner for video tag to align current and handle
			media.addEventListener('timeupdate', function(e) {
				var media = t.mediaElement.videoElement;
				var percentage = media.currentTime / media.duration;

				t._buildprogressbar.adjustCurrentAndHandleInSeek(percentage);
			}.bind(t));

			//attaching event listner for buffer
			media.addEventListener('progress', function(e) {
				var media = t.mediaElement.videoElement;
				var bufferedMaxTime;
				var bufferedMaxTimePercentage = 0;
				for (var i = 0 ;i <media.buffered.length;i++){
					if ((media.currentTime >= media.buffered.start(i)) && (media.currentTime <= media.buffered.end(i))) {
						bufferedMaxTime = media.buffered.end(i);
						bufferedMaxTimePercentage = bufferedMaxTime / media.duration;
					}
				}
				showBufferedData(bufferedMaxTimePercentage);
			}.bind(t));
		},
		_buildseekbarpreview : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching seekbar preview");

			var t = this;
			var seekbarPreviewContainerImgTag = '<img class="sp-progress-bar-seekbar-preview-img" />';
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.append(seekbarPreviewContainerImgTag);

			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.find('.sp-progress-bar-seekbar-preview-img');
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates = function(thubmnailsVttAjaxResponse){

				t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData = [];


				if(thubmnailsVttAjaxResponse != ''){
					var items = thubmnailsVttAjaxResponse.split('\n\r\n');

					/*due to parsing error found with VTT files*/
					if(items.length <= 1){
						items = thubmnailsVttAjaxResponse.split('\n\n');
					}

				    $.each(items,function(index,value) {

						var startTime;
						var endTime;
						var imgHeight;
						var imgWidth;
						var imgxPos;
						var imgyPos;
						var imgSrc;

						var item = items[index].split('\n');

						if((item[0] != undefined) && (item[0] != '') && (item[0].toLowerCase() != "webvtt")){
						     var timeslot = item[0].split('-->');
							 startTime = SaranyuHlsHTML5Player.Utils.timeCodeToSeconds(timeslot[0]);
							 endTime = SaranyuHlsHTML5Player.Utils.timeCodeToSeconds(timeslot[1]);
						}

						if((item[1] != undefined) && (item[1] != '') && (item[1].toLowerCase() != "webvtt")){
							 var imgpart = item[1].split('#');
							 imgSrc = imgpart[0];

							 var imgDiaAry = imgpart[1].split('=');
							 var imgDia = imgDiaAry[1].split(',');

							 imgxPos =	"-"+imgDia[0]+"px";
							 imgyPos = "-"+imgDia[1]+"px";
							 imgWidth = imgDia[2]+"px";
							 imgHeight = imgDia[3]+"px";

							 var ImgMetaData = {
						 						startTime : startTime,
						 						endTime : endTime,
						 						imgxPos : imgxPos,
						 						imgyPos : imgyPos,
						 						imgHeight : imgHeight,
						 						imgWidth : imgWidth,
						 						imgSrc : imgSrc
							 				   };

							 t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData.push(ImgMetaData);
						}
					  });
				//console.log("contructed thumbnails co-ordinates");
				//console.log(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData);
				}

			};

			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt = function(vttURL){

					//kill the request
					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt.abort = function(){
						t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajax.abort();
					};

					//abort the ajax call before initiating new one
					try{
						t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt.abort();
					}catch(e){
					}

					t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajax =  $.ajax({
						    type: "GET",
						    url: vttURL,
					}).done(function(msg){
							//console.log( "Data Saved: " + msg );
							t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates(msg);
					}.bind(t));

			};

			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.renderingThumbnailPreview = function(time){
				//get appropriate thumbnail and its position for given seek time
				if(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData.length > 1){
					$.each(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.parseAndCalculateCordinates.thumbnailsMetaData,function(index,value){
						if(time >= value.startTime && time <= value.endTime){
							$(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag).attr("src",value.imgSrc);
							$(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag).css("height",value.imgHeight);
							$(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag).css("width",value.imgWidth);
							$(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag).css("object-position",value.imgxPos +" "+ value.imgyPos);
						}
					});
				}
			}
			// start the seekbar preview calculation
			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt(t.options.file[0].thumbnails);
		},

		//fullscreen icon in bottom and controls
		_buildfullscreen : function(){

			SaranyuHlsHTML5Player.Utils.DLOG("Attaching fullscreen icon");
			var t = this;
			t.isFullScreen = false;

			var saranyuFullScreen = '<div class="sp-button sp-fullscreen-unfullscreen sp-fullscreen"><span class="tooltiptext">'+SaranyuHlsHTML5Player.defaultOptions.titleStrings.fullscreenText+'</span><button class="sp-fullscreen-btn"></button></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(saranyuFullScreen);
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-button.sp-fullscreen-unfullscreen');
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.tooltip = t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.find('.tooltiptext');

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.fullScreenChanges = function(){
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.addClass("sp-unfullscreen");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.removeClass("sp-fullscreen");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.unFullscreenText);
		        }

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.unFullScreenChanges = function (){
			    	t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.addClass("sp-fullscreen");
			    	t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.removeClass("sp-unfullscreen");
			    	t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.fullscreenText);
		           	t.playerInner.trigger("mousemove");
		        }

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.launchIntoFullscreen = function(){
					var element = t.playerInner[0];
					  if(element.requestFullscreen) {
					    element.requestFullscreen();
					  } else if(element.mozRequestFullScreen) {
					    element.mozRequestFullScreen();
					  } else if(element.webkitRequestFullscreen) {
					    element.webkitRequestFullscreen();
					  } else if(element.msRequestFullscreen) {
					    element.msRequestFullscreen();
					  }

					if(checkMobile()){
						screen.orientation.lock('landscape');
					}
			}

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.exitFullscreen = function(element) {
					  if(document.exitFullscreen) {
					    document.exitFullscreen();
					  } else if(document.mozCancelFullScreen) {
					    document.mozCancelFullScreen();
					  } else if(document.webkitExitFullscreen) {
					    document.webkitExitFullscreen();
					  }
					}

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.toggleFullscreen = function(){
				if (!t.isFullScreen) {
					   SaranyuHlsHTML5Player.Utils.DLOG("FullScreen Mode");
			           t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.launchIntoFullscreen();
			           t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.fullScreenChanges();
			           t.playerInner.addClass("sp-is-fullscreen");
			           t.isFullScreen = true;
			    } else {
					   SaranyuHlsHTML5Player.Utils.DLOG("Exit FullScreen Mode");
			           t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.exitFullscreen();
			           t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.unFullScreenChanges();
			           t.playerInner.removeClass("sp-is-fullscreen");
			           t.isFullScreen = false;
			    }
			}

			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.click(function(e){
				//change icon and trigger play pause of video element
				e.preventDefault();
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on FullScreen");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.toggleFullscreen();
			});

			$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange',function(){
				setTimeout(function(){
					if(!(t.playerInner.height() == window.innerHeight && t.playerInner.width() == window.innerWidth)){
						t.isFullScreen = false;
						t.playerInner.removeClass("sp-is-fullscreen");
						t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.unFullScreenChanges();
					}
				}.bind(t),400);
			}).bind(t);

			//getting to know if fullscreen exited by pressing "ESC"
			t.playerInner.keyup(function(event){
				var charCode = event.keyCode;
				if(charCode == 27){
				setTimeout(function(){
					if(t.isFullScreen){
						t.isFullScreen = false;
						t.playerInner.removeClass("sp-is-fullscreen");
						t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.unFullScreenChanges();
					}
				}.bind(t),500);
				}
			})
		},

		_buildclosebtn : function(){
		     console.log("closeBtn...");
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching close icon");
			var t = this;
			var media = t.mediaElement.videoElement;

			var closeBtn = '<div class="sp-close-button"><span class="tooltiptext"></span><button class="sp-close-btn"></button></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(closeBtn);
			t.fullControls.bottomControlBar.bottomPlayerControls.closeBtn = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-close-button .sp-close-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.closeBtn.tooltip = t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.find('.tooltiptext');





			t.fullControls.bottomControlBar.bottomPlayerControls.closeBtn.click(function(e){
				//change icon and trigger play pause of video element
				console.log("close button clicked");
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on close Icon");
				e.preventDefault();

				document.getElementById("video_player").remove();
			//	document.getElementById('video_player').innerHTML="";
				document.activeElement.blur();
				media.focus();
			        //uday added on 11-12-2016
			});

		},
		//creating and appending current and duration time and event listener
		_buildtime : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching time");
			var t = this;
			var media = t.mediaElement.videoElement;

			var saranyuPlayerTime = '<div class="sp-player-time"><span class="sp-plyr-currenttime">00:00</span>&nbsp;/&nbsp;<span class="sp-plyr-duration">00:00</span></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(saranyuPlayerTime);
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime = t.fullControls.bottomControlBar.bottomPlayerControls.find(".sp-player-time");
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.currentTime = t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.find(".sp-plyr-currenttime");
			t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.duration = t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.find(".sp-plyr-duration");

			media.addEventListener('timeupdate', function(event) {
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.currentTime.html(SaranyuHlsHTML5Player.Utils.secondsToTimeCode(media.currentTime));
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.duration.html(SaranyuHlsHTML5Player.Utils.secondsToTimeCode(media.duration));
			}.bind(t));

			if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlayerTime.addClass("firefox");
			}

		},

		_buildlogo : function(){
			console.log("Attaching logo");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var logo = '<div class="sp-logo-switch sp-logo-switch-wrap"><button class="sp-logo-switch-btn"></button><div class="sp-logo-switch-wrap sp-logo-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(logo);
			t.fullControls.bottomControlBar.bottomPlayerControls.logo = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-logo-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.logo.button = t.fullControls.bottomControlBar.bottomPlayerControls.logo.find('.sp-logo-switch-btn');


			},

		_buildnxplayback : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching nxplayback");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var nxplayback = '<div class="sp-nxplayback-switch sp-nxplayback-switch-wrap"><button class="sp-nxplayback-switch-btn"></button><div class="sp-nxplayback-switch-wrap sp-nxplayback-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(nxplayback);
			t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-nxplayback-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.button = t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.find('.sp-nxplayback-switch-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup = t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.find('.sp-nxplayback-switch-popup-wrap');

			function addEventsToNxplaybackSelectionButton(button){
				button.find('button').unbind().click(function(event){
					var speed = $(event.target).attr("speed");
					var label = $(event.target).attr("label");
					var media = t.mediaElement.videoElement;
					media.playbackRate = speed;
					if(speed==1){
						media.muted = false;
					}
					else{
						media.muted = true;
					}

					$(event.target).parent().parent().find(".active").removeClass("active").addClass("inactive");
					$(event.target).addClass("active").removeClass("inactive");

					t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.button.html(label);
					t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.hide();
					SaranyuHlsHTML5Player.Utils.DLOG("video playback speed changed to "+speed+"x or label "+label);
				}.bind(t));
			}

			$.each(options.nxplayback,function(index,value){
				var selectOptions;
				var classActiveOrInactive;

				if((value["default"].toLowerCase() === "true") || (value["default"] == true)){
					t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.button.html(value["label"]);
					media.playbackRate = value["speed"];
					classActiveOrInactive = "active";
				}else{
					classActiveOrInactive = "inactive";
				}

				selectOptions = "<div><button class="+classActiveOrInactive+" type='button' label="+value["label"]+" speed="+value["speed"]+">"+value["label"]+"</button></div>" ;
				addEventsToNxplaybackSelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.append(selectOptions));

			});

			t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.button.unbind().click(function(event){
				t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.toggle();

				t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
				t.fullControls.playlistPanel.hide();
			}.bind(t));

		},
		_buildqualityswitch : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching qualityswitch");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var quality = '<div class="sp-quality-switch sp-quality-switch-wrap"><button class="sp-quality-switch-btn"></button><div class="sp-quality-switch-wrap sp-quality-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(quality);
			t.fullControls.bottomControlBar.bottomPlayerControls.quality = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-quality-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.quality.button = t.fullControls.bottomControlBar.bottomPlayerControls.quality.find('.sp-quality-switch-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup = t.fullControls.bottomControlBar.bottomPlayerControls.quality.find('.sp-quality-switch-popup-wrap');

			//t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.html(options.qualityswitch.label);

			t._buildqualityswitch._buildQualityPopup = function(levelinfo){
				t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.empty();
				SaranyuHlsHTML5Player.Utils.DLOG("Attaching qualityswitch popup elements");

				function addEventsToQualitySelectionButton(button){
					button.find('button').unbind().click(function(event){
						var index = Number($(event.target).attr("index"));
						var label = $(event.target).html();
						var media = t.mediaElement.videoElement;

						if(t.playerType=="hls"){
							t.mediaElement.videoElement.hlsObj.currentLevel  = index;
						}
						else if(t.playerType=="mpd"){
								if(index == -1){
									t.mediaElement.videoElement.dashObj.setAutoSwitchQuality(true);
								}else{
									t.mediaElement.videoElement.dashObj.setAutoSwitchQuality(false);
									t.mediaElement.videoElement.dashObj.setQualityFor('video',t.mediaElement.videoElement.dashObj.bitratez[index].qualityIndex);
								}
						}

						$(event.target).parent().parent().find(".active").removeClass("active").addClass("inactive");
						$(event.target).addClass("active").removeClass("inactive");

						//t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.html(label);
						t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
						SaranyuHlsHTML5Player.Utils.DLOG("quality index changed to "+index+"x or label "+label);
					}.bind(t));
				}

				//the multi selection of quality present if there is more than one quality
				if(levelinfo.length > 1){

					if(t.playerType == "mpd"){
						$.each(levelinfo,function(index,value){
							SaranyuHlsHTML5Player.Utils.DLOG("Attaching quality switching with bit rate of "+(value.bitrate / 1024).toFixed(0)+" Kbps");

							var selectOptions = '';
							var classInactive = "inactive";
							var classActive = "active";
							var autoIndex = -1;
							var autoLabel = t.options.qualityswitch.label;
							var label =  ((value.bitrate) / 1024).toFixed(0);
							var resolution = value.height+"p";

							if(!t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.children().length){
									//t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.html(autoLabel);
									classActiveOrInactive = "active";
									selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
							}

							if(t.options.qualityswitch.metric == "resolution"){
								selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+t.mediaElement.videoElement.dashObj.bitratez[index].qualityIndex+">"+resolution+"</button></div>" ;
							}else if(t.options.qualityswitch.metric == "bitrate")
							{
								selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+t.mediaElement.videoElement.dashObj.bitratez[index].qualityIndex+">"+label+" kbps</button></div>" ;
							}

							addEventsToQualitySelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.append(selectOptions));
						});
					}else if(t.playerType == "hls"){
							$.each(levelinfo,function(index,value){
							SaranyuHlsHTML5Player.Utils.DLOG("Attaching quality switching with bit rate of "+(value.bitrate / 1024).toFixed(0)+" Kbps");

							var selectOptions = '';
							var classInactive = "inactive";
							var classActive = "active";
							var autoIndex = -1;
							var autoLabel = t.options.qualityswitch.label;
							var label =  ((value.bitrate) / 1024).toFixed(0);
							var resolution = value.height+"p";

							if(!t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.children().length){
									//t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.html(autoLabel);
									classActiveOrInactive = "active";
									selectOptions = "<div class="+classActive+" ><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
							}

							if(t.options.qualityswitch.metric == "resolution")
							{
								selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+index+">"+resolution+"</button></div>" ;
							}
							else if(t.options.qualityswitch.metric == "bitrate")
							{
								selectOptions += "<div class="+classInactive+"><button class="+classInactive+" type='button' label="+label+" index="+index+">"+label+" kbps</button></div>" ;
							}
							//selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+index+">"+label+" Kbps</button></div>" ;
							addEventsToQualitySelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.append(selectOptions));
							});
					}





				}else{
					SaranyuHlsHTML5Player.Utils.DLOG("Attaching quality switching Auto only , if there is just one quality");
					var selectOptions = '';
					var classInactive = "inactive";
					var classActive = "active";
					var autoIndex = -1;
					var autoLabel = t.options.qualityswitch.label;

					//t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.html(autoLabel);
					classActiveOrInactive = "active";
					selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
					addEventsToQualitySelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.append(selectOptions));
				}

			};

			// hide and show the popup of quality switching
			t.fullControls.bottomControlBar.bottomPlayerControls.quality.button.unbind().click(function(event){
				try{
					if(t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.children().length > 0){
						t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.toggle();

						t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
						t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.hide();
						t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
						t.fullControls.playlistPanel.hide();
					}else{
						t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
					}
				}catch(e){

				}
			}.bind(t));
		},
		_buildmultiaudio : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching multiaudio tracks");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var buttonName = 'Audio'
			var multiaudio = '<div class="sp-multiaudio-switch sp-multiaudio-switch-wrap"><button class="sp-multiaudio-switch-btn"></button><div class="sp-multiaudio-switch-wrap sp-multiaudio-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(multiaudio);
			t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-multiaudio-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.button = t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.find('.sp-multiaudio-switch-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup = t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.find('.sp-multiaudio-switch-wrap');

			t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.button.html(buttonName);

			t._buildmultiaudio._buildMultiaudioPopup = function(trackinfo){
				t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.empty();
				SaranyuHlsHTML5Player.Utils.DLOG("Attaching multiaudio popup elements");

				function addEventsToMultiaudioSelectionButton(button){
					button.find('button').unbind().click(function(event){
						var index = Number($(event.target).attr("index"));
						var label = $(event.target).html();
						var media = t.mediaElement.videoElement;
						t.mediaElement.videoElement.hlsObj.audioTrack  = index;

						$(event.target).parent().parent().find(".active").removeClass("active").addClass("inactive");
						$(event.target).addClass("active").removeClass("inactive");

						t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
						SaranyuHlsHTML5Player.Utils.DLOG("multiaudio index changed to "+index+"x or label "+label);
					}.bind(t));
				}

				//the multi selection of quality present if there is more than one quality
				if(trackinfo.length > 1){

					var groupIdOfFirstTrack = trackinfo[0].groupId;

					$.each(trackinfo,function(index,value){
					SaranyuHlsHTML5Player.Utils.DLOG("Attaching multiaudio switching with name of "+(value.name));

					var selectOptions = '';
					var classInactive = "inactive";
					var classActive = "active";
					var autoIndex = 0;
					var autoLabel = SaranyuHlsHTML5Player.defaultOptions.titleStrings.multiaudio;
					var label =  value.name;

					if(value.groupId != groupIdOfFirstTrack)
						return;

					if(!t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.children().length){
							classActiveOrInactive = "active";
							selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
					}

					selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+index+">"+label+"</button></div>" ;
					addEventsToMultiaudioSelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.append(selectOptions));
					});
				}else{
				/*alert("only one audio-----");
					SaranyuHlsHTML5Player.Utils.DLOG("Attaching multiaudio switching Auto only , if there is just one audio");
					var selectOptions = '';
					var classInactive = "inactive";
					var classActive = "active";
					var autoIndex = 0;
					var autoLabel = SaranyuHlsHTML5Player.defaultOptions.titleStrings.multiaudio;

					t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.button.html(autoLabel);
					classActiveOrInactive = "active";
					selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
					addEventsToMultiaudioSelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.append(selectOptions));
					*/
				}

			};

			// hide and show the popup of quality switching
			t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.button.unbind().click(function(event){

				if(t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.children().length > 0){
					t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.toggle();

					t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.toggle();
					t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
					t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.hide();
					t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
					t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
					t.fullControls.playlistPanel.hide();
				}else{
					t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
				}

			}.bind(t));
		},
		_buildsubtitles : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching subtitles tracks");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var buttonName = ''
			var subtitles = '<div class="sp-subtitles-switch sp-subtitles-switch-wrap"><button class="sp-subtitles-switch-btn"></button><div class="sp-subtitles-switch-wrap sp-subtitles-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(subtitles);
			t.fullControls.bottomControlBar.bottomPlayerControls.subtitles = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-subtitles-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.button = t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.find('.sp-subtitles-switch-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup = t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.find('.sp-subtitles-switch-wrap');

			//t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.button.html(buttonName);

			var subtitlesPanel = '<div class="sp-subtitles-panel"></div>';
			t.mediaElement.append(subtitlesPanel);
			t.mediaElement.subtitlesPanel = t.mediaElement.find('.sp-subtitles-panel');
			t.mediaElement.subtitlesPanel.subtitlesArray = [];

			t._buildsubtitles.hideSubTitlesContainer = function(){
				t.mediaElement.subtitlesPanel.hide();
			}

			t._buildsubtitles.showSubTitlesContainer = function(){
				if(t.mediaElement.subtitlesPanel.html().length > 1){
					t.mediaElement.subtitlesPanel.show();
				}else{
					t.mediaElement.subtitlesPanel.hide();
				}
			}
			t._buildsubtitles.hideSubTitlesContainer();

			t._buildsubtitles._buildSubtitlesPopup = function(trackinfo){

				var playlistIndex = 0;

				if(typeof(t.fullControls.playlistPanel) !== "undefined" && typeof(t.fullControls.playlistPanel.playingIndex == "undefined")){
					playlistIndex = t.fullControls.playlistPanel.playingIndex;
				}

              SaranyuHlsHTML5Player.Utils.DLOG("Check playlist index for subtitles"+playlistIndex);
              console.log("Check playlist index for subtitles"+playlistIndex +t.options.file[playlistIndex].subtitles);
				trackinfo = t.options.file[playlistIndex].subtitles;
				t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.empty();
				SaranyuHlsHTML5Player.Utils.DLOG("Attaching subtitles popup elements"+ t.mediaElement.subtitlesPanel.subtitlesArray.length);
                t.mediaElement.subtitlesPanel.subtitlesArray = [];
				SaranyuHlsHTML5Player.Utils.DLOG("check subtitle length"+ t.mediaElement.subtitlesPanel.subtitlesArray.length);
				function fetchAndRenderSubtitles(choosenIndex){
                     SaranyuHlsHTML5Player.Utils.DLOG(choosenIndex+" uday 2 Check playlist index for subtitles "+playlistIndex);
					if(isNaN(choosenIndex)){
						t.mediaElement.subtitlesPanel.subtitlesArray = [];
						return false;
					}

					t.mediaElement.subtitlesPanel.subtitlesArray = [];

					//var playlistIndex = 0;
					/*try{
						if(t.fullControls.playlistPanel.playingIndex){
							playlistIndex = t.fullControls.playlistPanel.playingIndex;
						}
					}catch(e){
					}*/

					$.ajax({
						url: t.options.file[0].subtitles[0].file,
						context : t,
						contentType: 'text/html',
						//headers: { 'accept-encoding' : "gzip" },
						success: function(data){
							//data = JXG.decompress(data);
							var t = this;
									function strip(s) {
										return s.replace(/^\s+|\s+$/g,"");
									}
									var srt = data.replace(/\r\n|\r|\n/g, '\n');
									srt = strip(srt);
									var srt_ = srt.split('\n\n');
									var cont = 0;
									for(s in srt_) {
											var st = srt_[s].split('\n');
											if(st.length >=2) {
													var number = st[0];
													var start = strip(st[1].split(' --> ')[0]);
													var end = strip(st[1].split(' --> ')[1]);
													var text = st[2];

													if(st.length > 2) {
															for(j=3; j<st.length;j++)
																 text += '\n'+st[j];
													}
													//define variable type as Object
													t.mediaElement.subtitlesPanel.subtitlesArray[cont] = {};
													t.mediaElement.subtitlesPanel.subtitlesArray[cont].number = number;
													t.mediaElement.subtitlesPanel.subtitlesArray[cont].start = start;
													t.mediaElement.subtitlesPanel.subtitlesArray[cont].end = end;
													t.mediaElement.subtitlesPanel.subtitlesArray[cont].text = text;
											}
											cont++;
									}
							}});
				}

				function addEventsToSubtitlesSelectionButton(button){
					button.find('button').unbind().click(function(event){
						var index = Number($(event.target).attr("index"));
						var label = $(event.target).html();
						var media = t.mediaElement.videoElement;

						fetchAndRenderSubtitles(index);

						$(event.target).parent().parent().find(".active").removeClass("active").addClass("inactive");
						$(event.target).addClass("active").removeClass("inactive");

						t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
						SaranyuHlsHTML5Player.Utils.DLOG("subtitles index changed to "+index+"x or label "+label);
					}.bind(t));
				}

				//the multi selection of quality present if there is more than one quality

				if(trackinfo!=undefined){
				if(typeof(trackinfo[0].file) == "string"){
					$.each(trackinfo,function(index,value){
					SaranyuHlsHTML5Player.Utils.DLOG("Attaching subtitles switching with name of "+(value.lang));

					var selectOptions = '';
					var classInactive = "inactive";
					var classActive = "active";
					var autoIndex = 'no';
					var autoLabel = SaranyuHlsHTML5Player.defaultOptions.titleStrings.subtitles;
					var label =  value.lang;

					if(!t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.children().length){
							classActiveOrInactive = "active";
							selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
					}

					selectOptions += "<div><button class="+classInactive+" type='button' label="+label+" index="+index+">"+label+"</button></div>" ;
					addEventsToSubtitlesSelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.append(selectOptions));
					});
				}
				}
				else{
					SaranyuHlsHTML5Player.Utils.DLOG("Attaching multiaudio switching Auto only , if there is just one audio");
					var selectOptions = '';
					var classInactive = "inactive";
					var classActive = "active";
					var autoIndex = 'no';
					var autoLabel = SaranyuHlsHTML5Player.defaultOptions.titleStrings.subtitles;

					//t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.button.html(autoLabel);
					classActiveOrInactive = "active";
					selectOptions = "<div><button class="+classActive+" type='button' label="+autoLabel+" index="+autoIndex+">"+autoLabel+"</button></div>" ;
					addEventsToSubtitlesSelectionButton(t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.append(selectOptions));
				}

			};

			t.mediaElement.videoElement.addEventListener('timeupdate',function(){
						//get subtitle text
						//check if given time range has subtitles
						//if given time range has subtitles then display
						//if given time range has no subtitles then hide.
						function hhmmssTOs(time){
							var hms = time;   // your input string
							var a = hms.split(':'); // split it at the colons
							// minutes are worth 60 seconds. Hours are worth 60 minutes.
							var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
							return seconds;
						}
						(function getSubtitlesTextIfPresent(){
							var currentPlayerTimeinSeconds = Math.floor(Number(t.mediaElement.videoElement.currentTime));
							if(t.mediaElement.subtitlesPanel.subtitlesArray.length > 0){
								for(var i =0;i<t.mediaElement.subtitlesPanel.subtitlesArray.length;i++){
									var startTime = hhmmssTOs(t.mediaElement.subtitlesPanel.subtitlesArray[i].start.split(",")[0]);
									var endTime = hhmmssTOs(t.mediaElement.subtitlesPanel.subtitlesArray[i].end.split(",")[0]);
									if(currentPlayerTimeinSeconds >= startTime && currentPlayerTimeinSeconds <= endTime){
										t._buildsubtitles.showSubTitlesContainer();
										t.mediaElement.subtitlesPanel.html(t.mediaElement.subtitlesPanel.subtitlesArray[i].text);
										return;
									}
								}
							}
								t._buildsubtitles.hideSubTitlesContainer()
						})();
			});

			// hide and show the popup of quality switching
			t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.button.unbind().click(function(event){
				try{
					if(t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.children().length > 0){
						t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.toggle();
						t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
						t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.hide();
						t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
						t.fullControls.playlistPanel.hide();
					}else{
						t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
					}
				}catch(e){
				}
			}.bind(t));
		},

		_buildplaylist : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Building playlist");

			var t = this;
			var media = t.mediaElement.videoElement;
			var playlist = '<div class="sp-button sp-playlist-button-wrap sp-playlist-inactive"><span class="tooltiptext">'+SaranyuHlsHTML5Player.defaultOptions.titleStrings.playlist+'</span><button class="sp-playlist-btn"></button></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(playlist);
			t.fullControls.bottomControlBar.bottomPlayerControls.playlist = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-playlist-button-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.playlist.button = t.fullControls.bottomControlBar.bottomPlayerControls.playlist.find('.sp-playlist-btn');

			//video playlist popup panel
			//panel should be popup with playlist items
			var playlistPanel = '<div class="sp-playlist-panel"></div>';
			t.fullControls.append(playlistPanel);
			t.fullControls.playlistPanel = t.fullControls.find('.sp-playlist-panel');

			//presently playing index is
			t.fullControls.playlistPanel.playingIndex = 0;


			//left and right buttons
			var playlistLeftButton = '<span class="sp-playlist-panel-left-btn"></span>';
			var playlistRightButton = '<span class="sp-playlist-panel-right-btn"></span>';
			t.fullControls.playlistPanel.append(playlistLeftButton);
			t.fullControls.playlistPanel.append(playlistRightButton);

			t.fullControls.playlistPanel.playlistLeftButton = t.fullControls.find('.sp-playlist-panel-left-btn');
			t.fullControls.playlistPanel.playlistRightButton = t.fullControls.find('.sp-playlist-panel-right-btn');

			//the view port for items
			var playlistItemView = '<div class="sp-playlist-panel-itemview"></div>';
			t.fullControls.playlistPanel.append(playlistItemView);
			t.fullControls.playlistPanel.playlistItemView = t.fullControls.find('.sp-playlist-panel-itemview');

			//Loop through the items and append to playlist panel
			$.each(t.options.file,function(index,value){
				var item;
				if(index == 0){
					item = '<div class="item sp-playlist-active-item sp-playlist-item" indexoftile="'+index+'"><img class="sp-playlist-item-img" src="'+t.options.file[index].poster+'"><span class="sp-playlist-item-videotitle">'+t.options.file[index].videotitle+'</span></div>';
				}else{
					item = '<div class="item sp-playlist-item" indexoftile="'+index+'"><img class="sp-playlist-item-img" src="'+t.options.file[index].poster+'"><span class="sp-playlist-item-videotitle">'+t.options.file[index].videotitle+'</span></div>';
				}
				t.fullControls.playlistPanel.playlistItemView.append(item);
			});

			//Attaching saranyu owl carousel for playlist
			t.fullControls.playlistPanel.playlistItemView.saranyuOwlCarousel = $(t.fullControls.playlistPanel.playlistItemView);
			t.fullControls.playlistPanel.playlistItemView.saranyuOwlCarousel.saranyuOwlCarousel({
		      margin : 10,
		      items : 5,
		      loop : false,
		      afterAction: function(){
	      	      if ( this.itemsAmount > this.visibleItems.length ) {
	      	      	    t.fullControls.playlistPanel.playlistLeftButton.show();
				        t.fullControls.playlistPanel.playlistRightButton.show();

				        if ( this.currentItem == 0 ) {
				          t.fullControls.playlistPanel.playlistLeftButton.hide();


				        }
				        if ( this.currentItem == this.maximumItem ) {
				         t.fullControls.playlistPanel.playlistRightButton.hide();
				        }
	      	      }else{
	      	      		t.fullControls.playlistPanel.playlistLeftButton.hide();
				        t.fullControls.playlistPanel.playlistRightButton.hide();
	      	      }
		      }
		  	});

			t.fullControls.playlistPanel.removeActiveClass = function(){
				$.each(t.fullControls.playlistPanel.find(".sp-playlist-item"),function(index,value){
		  			$(value).removeClass("sp-playlist-active-item");
		  		});
			};

			t.fullControls.playlistPanel.addActiveClass = function(indexToActive){
				$.each(t.fullControls.playlistPanel.find(".sp-playlist-item"),function(index,value){
		  			if(index == indexToActive){
		  				$(value).addClass("sp-playlist-active-item");
		  			}
		  		});
			};


			t.fullControls.playlistPanel.buildAdCuesAfterPlaylistUpdate = function(){
				//remove and reconstruct ad cues
		  		try{
		  			t._buildadvertisement._buildadcue.constructed = false;
		  		}catch(e){
		  		}

	  			t.mediaElement.videoElement.addEventListener('timeupdate',function(){
		 			if(t.options.advertisement.cues == 'true' && (!isNaN(t.mediaElement.videoElement.duration)) && (t.options.content == 'vod')){
		 				if(!t._buildadvertisement._buildadcue.constructed){
		 					t._buildadvertisement._buildadcue();
		 				}
		 			}
		 		});
			}


			t.fullControls.playlistPanel.updateNewPlaylistStats = function(choosenIndex){
			    console.log("Clicked on item "+choosenIndex);
				console.log("playingIndex "+t.fullControls.playlistPanel.playingIndex);
			    t.fullControls.playlistPanel.playingIndex = choosenIndex;
				console.log("playingIndex "+t.fullControls.playlistPanel.playingIndex);
				t._createAndAppendHLStoPlayer(t.options.file[choosenIndex]);
		  		t.fullControls.playlistPanel.removeActiveClass();
		  		t.fullControls.playlistPanel.addActiveClass(choosenIndex);
		  		t.fullControls.playlistPanel.playingIndex = choosenIndex;

		  		t.fullControls.playlistPanel.buildAdCuesAfterPlaylistUpdate();
			}

			//Attaching click listeners for item
		  	t.fullControls.playlistPanel.find(".sp-playlist-item").click(function(e){
		  		e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
		  		var choosenIndex = $(this).attr("indexoftile");
		  		SaranyuHlsHTML5Player.Utils.DLOG("Clicked on item "+choosenIndex);
		  		t.fullControls.playlistPanel.updateNewPlaylistStats(choosenIndex);
		  		if(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag){
		  			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt(t.options.file[choosenIndex].thumbnails);
		  		}
		  	});

			//Highlight the playlist button
			t.fullControls.bottomControlBar.bottomPlayerControls.playlist.button.click(function(e){
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on playlist button");
				t.fullControls.playlistPanel.toggle();

				if(t._buildadvertisement.initializeAd.adStarted && !t._buildadvertisement.initializeAd.isLinear){
					t.adContainer.toggleClass("sp-playlist-show");
				}

				t.fullControls.bottomControlBar.bottomPlayerControls.multiaudio.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.subtitles.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.quality.popup.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.nxplayback.popup.hide();
			});

			t.fullControls.playlistPanel.playlistLeftButton.click(function(e){
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on prev playlist button");
				t.fullControls.playlistPanel.playlistItemView.saranyuOwlCarousel.trigger('owl.prev');

			});

			t.fullControls.playlistPanel.playlistRightButton.click(function(e){
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on next playlist button");
				t.fullControls.playlistPanel.playlistItemView.saranyuOwlCarousel.trigger('owl.next');
			});

			t.mediaElement.videoElement.addEventListener('ended',function(){
				if((t.options.autoplay === 'true') || (t.options.autoplay == true)){
					var nextIndexToBePlayer = Number(t.fullControls.playlistPanel.playingIndex) + 1;
					if(nextIndexToBePlayer < t.options.file.length){
						SaranyuHlsHTML5Player.Utils.DLOG("video ended choosing next playlist index "+nextIndexToBePlayer);
						t.fullControls.playlistPanel.updateNewPlaylistStats(nextIndexToBePlayer);
					}else{
						SaranyuHlsHTML5Player.Utils.DLOG("video ended choosing next playlist index is not present so ending playlist "+nextIndexToBePlayer);
					}
				}
				else{
					SaranyuHlsHTML5Player.Utils.DLOG("player will be in replay mode and it will play same file");
				}
			});
		},

		//		related videos--------------

		_buildrelatedvideo : function(boolz){

			SaranyuHlsHTML5Player.Utils.DLOG("Building related video");

			var t = this;
			var media = t.mediaElement.videoElement;
			var related;

			//video related popup panel
			//panel should be popup with playlist items

			var relatedPanel = '<div class="sp-related-panel"></div>';

			t.fullControls.append(relatedPanel);
			t.fullControls.relatedPanel = t.fullControls.find('.sp-related-panel');
			t.fullControls.relatedPanel.boolz = boolz;
			if(t.fullControls.relatedPanel.boolz){
				t.fullControls.relatedPanel.relatedVideosDisplayTimerCount = 0;
			}else{
				t.fullControls.relatedPanel.relatedVideosDisplayTimerCount = 0;
			}


			//presently playing index is
			t.fullControls.relatedPanel.playingIndex = "";

			var relatedVideoText='<span class="sp-related-panel-titletext">Up Next</span>';
            t.fullControls.relatedPanel.append(relatedVideoText);
			//left and right buttons
			var relatedLeftButton = '<span class="sp-related-panel-left-btn"></span>';
			var relatedRightButton = '<span class="sp-related-panel-right-btn"></span>';
			t.fullControls.relatedPanel.append(relatedLeftButton);
			t.fullControls.relatedPanel.append(relatedRightButton);

			t.fullControls.relatedPanel.relatedLeftButton = t.fullControls.find('.sp-related-panel-left-btn');
			t.fullControls.relatedPanel.relatedRightButton = t.fullControls.find('.sp-related-panel-right-btn');

			//the view port for items

			var relatedItemView = '<div class="sp-related-panel-itemview"></div>';

			t.fullControls.relatedPanel.append(relatedItemView);
			t.fullControls.relatedPanel.relatedItemView = t.fullControls.find('.sp-related-panel-itemview');
            if(t.options.relatedvideoautoplay=="false"){
				//Loop through the items and append to related panel
				$.each(t.options.relatedvideos,function(index,value){
					var item;
					if(index == 0){
						item = '<div class="item sp-related-active-item sp-related-item" indexoftile="'+index+'"><img class="sp-related-item-img" src="'+t.options.relatedvideos[index].poster+'"><span class="sp-related-item-videotitle" style="display:none;" >'+t.options.relatedvideos[index].videotitle+'</span></div>';
					}else{
						item = '<div class="item sp-related-item" indexoftile="'+index+'"><img class="sp-related-item-img" src="'+t.options.relatedvideos[index].poster+'"><span class="sp-related-item-videotitle" style="display:none;">'+t.options.relatedvideos[index].videotitle+'</span></div>';
					}
					t.fullControls.relatedPanel.relatedItemView.append(item);
				});
				var itemsCustomVar = [[0, 1],[366, 1],[732, 2],[1098, 3],[1464, 4]];
			}
			else
			{
			    console.log("only 1 related video------");
			    var item;
				var index=0;
			    item = '<div class="item sp-related-item" indexoftile="'+index+'"><img class="sp-related-item-img" src="'+t.options.relatedvideos[index].poster+'"></div>';
                t.fullControls.relatedPanel.relatedItemView.append(item);

				var relatedVideoautoText='<span class="sp-related-panel-autotext">'+t.options.relatedvideos[index].videotitle+'</span><span class="sp-related-panel-autotext1">Will automatically load in <span class="timer">10</span> seconds</span>';
				t.fullControls.relatedPanel.append(relatedVideoautoText);
				var itemsCustomVar = [[0, 2],[440, 3],[768, 4],[1366, 5]];
			}

			//Attaching saranyu owl carousel for related
			t.fullControls.relatedPanel.relatedItemView.saranyuOwlCarousel = $(t.fullControls.relatedPanel.relatedItemView);
			t.fullControls.relatedPanel.relatedItemView.saranyuOwlCarousel.saranyuOwlCarousel({
			  itemsCustom : itemsCustomVar ,
		      loop : false,
		      afterAction: function(){
	      	      if ( this.itemsAmount > this.visibleItems.length ) {
	      	      	    t.fullControls.relatedPanel.relatedLeftButton.show();
				        t.fullControls.relatedPanel.relatedRightButton.show();

				        if ( this.currentItem == 0 ) {
				          t.fullControls.relatedPanel.relatedLeftButton.hide();


				        }
				        if ( this.currentItem == this.maximumItem ) {
				         t.fullControls.relatedPanel.relatedRightButton.hide();
				        }
	      	      }else{
	      	      		t.fullControls.relatedPanel.relatedLeftButton.hide();
				        t.fullControls.relatedPanel.relatedRightButton.hide();
	      	      }
		      }
		  	});



			t.fullControls.relatedPanel.removeActiveClass = function(){
				$.each(t.fullControls.relatedPanel.find(".sp-related-item"),function(index,value){
		  			$(value).removeClass("sp-related-active-item");
		  		});
			};

			t.fullControls.relatedPanel.addActiveClass = function(indexToActive){
				$.each(t.fullControls.relatedPanel.find(".sp-related-item"),function(index,value){
		  			if(index == indexToActive){
		  				$(value).addClass("sp-related-active-item");
		  			}
		  		});
			};


			t.fullControls.relatedPanel.buildAdCuesAfterrelatedUpdate = function(){
				//remove and reconstruct ad cues
		  		try{
		  			t._buildadvertisement._buildadcue.constructed = false;
		  		}catch(e){
		  		}

	  			t.mediaElement.videoElement.addEventListener('timeupdate',function(){
		 			if(t.options.advertisement.cues == 'true' && (!isNaN(t.mediaElement.videoElement.duration)) && (t.options.content == 'vod')){
		 				if(!t._buildadvertisement._buildadcue.constructed){
		 					t._buildadvertisement._buildadcue();
		 				}
		 			}
		 		});
			}


			t.fullControls.relatedPanel.updateNewrelatedStats = function(choosenIndex){
				console.log("play the related video now-----");
			    console.log("Clicked on item "+choosenIndex);
				console.log("playingIndex "+t.fullControls.relatedPanel.playingIndex);
			    t.fullControls.relatedPanel.playingIndex = choosenIndex;
				console.log("playingIndex "+t.fullControls.relatedPanel.playingIndex);

		  		try{
		  			//t._buildsubtitles._buildSubtitlesPopup(t.options.relatedvideos[1].subtitles);
		  			t.options.file[0].subtitles[0].file = t.options.relatedvideos[choosenIndex].subtitles[0].file;
		  			//t._buildsubtitles._buildSubtitlesPopup();
		  		}catch(e){
		  		}

				t._createAndAppendHLStoPlayer(t.options.relatedvideos[choosenIndex]);
		  		t.fullControls.relatedPanel.removeActiveClass();
		  		t.fullControls.relatedPanel.addActiveClass(choosenIndex);
		  		t.fullControls.relatedPanel.playingIndex = choosenIndex;
		  		t.fullControls.relatedPanel.buildAdCuesAfterrelatedUpdate();
			}

			//Attaching click listeners for item
		  	t.fullControls.relatedPanel.find(".sp-related-item").click(function(e){
		  		e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
		  		var choosenIndex = $(this).attr("indexoftile");
		  		SaranyuHlsHTML5Player.Utils.DLOG("Clicked on item "+choosenIndex);
		  		t.fullControls.relatedPanel.updateNewrelatedStats(choosenIndex);
                try{
		  		if(t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.seekbarPreviewContainerImgTag){
		  			t.fullControls.bottomControlBar.bottomProgressBar.progressbar.seekbarPreviewContainer.ajaxForVtt(t.options.relatedvideos[choosenIndex].thumbnails);
		  		}
                 }catch(e){
                }

					t.fullControls.relatedPanel.hide();
					media.play();

					try{
							t.eventcallbacks.onRelatedVideoClick(t.options.relatedvideos[choosenIndex].mediaid,t.options.relatedvideos[choosenIndex].catalogid);
					}catch(e){
					}
				});

			t.fullControls.relatedPanel.relatedLeftButton.click(function(e){
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on prev related button");
				t.fullControls.relatedPanel.relatedItemView.saranyuOwlCarousel.trigger('owl.prev');

			});

			t.fullControls.relatedPanel.relatedRightButton.click(function(e){
				e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
				SaranyuHlsHTML5Player.Utils.DLOG("Clicked on next related button");
				t.fullControls.relatedPanel.relatedItemView.saranyuOwlCarousel.trigger('owl.next');
			});

			if(!boolz){
				t.mediaElement.videoElement.addEventListener('timeupdate', function(e) {
					try{
							clearTimeout(t.fullControls.relatedPanel.relatedVideosTimer);
							clearInterval(t.fullControls.relatedPanel.relatedVideosDisplayTimer);
							$(t.fullControls.relatedPanel.find(".sp-related-panel-autotext1")).html("Will automatically load in <span class='timer'>10</span> seconds");
							t.fullControls.relatedPanel.hide();
					}catch(e){
					}
				});

				t.mediaElement.videoElement.addEventListener('ended',function(){

				if(t.fullControls.relatedPanel.boolz){
					t.fullControls.relatedPanel.relatedVideosDisplayTimerCount = 0;
				}else{
					t.fullControls.relatedPanel.relatedVideosDisplayTimerCount = 0;
				}

				if((t.options.relatedvideoautoplay=="true" || t.options.relatedvideoautoplay==true) && (t.options.relatedvideos.length > 0))
				{
							if(t.fullControls.relatedPanel.playingIndex === ""){
								t.fullControls.relatedPanel.playingIndex = 0;
								var nextIndexToBePlayer = 0;
							}else{
								var nextIndexToBePlayer = Number(t.fullControls.relatedPanel.playingIndex) + 1;
								if(nextIndexToBePlayer > t.options.relatedvideos.length - 1){
									nextIndexToBePlayer = 0;
								}
							}

					    if(nextIndexToBePlayer <= t.options.relatedvideos.length){

							console.log("related video show now---"+nextIndexToBePlayer);
							t.fullControls.relatedPanel.item = t.fullControls.relatedPanel.find(".sp-related-item");
							t.fullControls.relatedPanel.item.attr("indexoftile",nextIndexToBePlayer);

							t.fullControls.relatedPanel.item.span=t.fullControls.relatedPanel.item.find("span");
							t.fullControls.relatedPanel.item.span.html(t.options.relatedvideos[nextIndexToBePlayer].videotitle);

							t.fullControls.relatedPanel.item.img = t.fullControls.relatedPanel.item.find("img");
							$(t.fullControls.relatedPanel.item.img).attr("src",t.options.relatedvideos[nextIndexToBePlayer].poster);
						    console.log("now next item should play");

							// initialize related video title
							$(t.fullControls.relatedPanel.find(".sp-related-panel-autotext").html(t.options.relatedvideos[nextIndexToBePlayer].videotitle));

								if(t.fullControls.relatedPanel.relatedVideosDisplayTimerCount == 0){
							        t.fullControls.relatedPanel.hide();
									t.fullControls.relatedPanel.updateNewrelatedStats(nextIndexToBePlayer);
									try{
										t.eventcallbacks.onRelatedVideoClick(t.options.relatedvideos[nextIndexToBePlayer].mediaid,t.options.relatedvideos[nextIndexToBePlayer].catalogid);
									}catch(e){
									}
									return;
								}

								try{
									window.clearInterval(t.fullControls.relatedPanel.relatedVideosDisplayTimer);
								}catch(e){
								}


								t.fullControls.relatedPanel.relatedVideosDisplayTimer = setInterval(function(){
									  var timeoutz = t.fullControls.relatedPanel.relatedVideosDisplayTimerCount;
									  	$(t.fullControls.relatedPanel.find(".sp-related-panel-autotext").html(t.options.relatedvideos[nextIndexToBePlayer].videotitle));
										$(t.fullControls.relatedPanel.find(".sp-related-panel-autotext1")).html("Will automatically load in <span class='timer'>"+timeoutz+"</span> seconds");
										t.fullControls.relatedPanel.relatedVideosDisplayTimerCount -= 1;
								}.bind(t), 1000);

								try{
									window.clearInterval(t.fullControls.relatedPanel.relatedVideosTimer);
								}catch(e){
								}

								t.fullControls.relatedPanel.relatedVideosTimer = setTimeout(function(){
							        t.fullControls.relatedPanel.hide();
									t.fullControls.relatedPanel.updateNewrelatedStats(nextIndexToBePlayer);

									try{
										t.eventcallbacks.onRelatedVideoClick(t.options.relatedvideos[nextIndexToBePlayer].mediaid,t.options.relatedvideos[nextIndexToBePlayer].catalogid);
									}catch(e){
									}
								}.bind(t,nextIndexToBePlayer),10000);
						 }
					}
				});
			}

			t._buildrelatedvideo.flushRelatedVideos = function(){
					t.options.relatedvideos = [];
					t.fullControls.relatedPanel.playingIndex = "";
			}

			t._buildrelatedvideo.appendRelatedVideos = function(relatedVideosArray,flag_autoplay_related){
					if(typeof(flag_autoplay_related) != "undefined"){
							t.options.relatedvideoautoplay = flag_autoplay_related;
					}

					$.each(relatedVideosArray,function(index,value){
						t.options.relatedvideos.push(value);
					})
					t.fullControls.relatedPanel.remove();
					t._buildrelatedvideo(true);

			}.bind(t);
		},
		/*
		_buildclosedcaption : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching closedcaption");
			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			var closedcaption = '<div class="sp-closedcaptions-switch sp-closedcaptions-switch-wrap"><button class="sp-closedcaptions-switch-btn"></button><div class="sp-closedcaptions-switch-wrap sp-closedcaptions-switch-popup-wrap"></div></div>';
			t.fullControls.bottomControlBar.bottomPlayerControls.append(closedcaption);
			t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption = t.fullControls.bottomControlBar.bottomPlayerControls.find('.sp-closedcaptions-switch-wrap');
			t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.button = t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.find('.sp-closedcaptions-switch-btn');
			t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.popup = t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.find('.sp-closedcaptions-switch-popup-wrap');

			function addSubtitlesTrack(button){
				button.find('button').unbind().click(function(event){
					var file = $(event.target).attr("file");
					var label = $(event.target).attr("label");
					var track = '<track label="English subtitles" kind="subtitles" srclang="en" src="'+file+'" default>';

					if(t.mediaElement.videoElement.track && t.mediaElement.videoElement.track.length){
						t.mediaElement.videoElement.track.remove();
					}
					t.mediaElement.videoElement.track = "";
					$(t.mediaElement.videoElement).html(track);
					t.mediaElement.videoElement.track = t.mediaElement.videoElement.find("track");
					$(event.target).parent().parent().find(".active").removeClass("active").addClass("inactive");
					$(event.target).addClass("active").removeClass("inactive");

					t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.button.html(label);
					t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.popup.hide();
					SaranyuHlsHTML5Player.Utils.DLOG("video closed caption changed to "+file+" or label "+label);
				}.bind(t));
			}

			$.each(options.closedcaption,function(index,value){
				var selectOptions;
				var classActiveOrInactive;

				if((value["default"].toLowerCase() === "true") || (value["default"] == true)){
					var file = value["file"];
					var label = value["label"];
					var track = '<track label="English subtitles" kind="subtitles" srclang="en" src="'+file+'" default>';

					t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.button.html(label);
					if(t.mediaElement.videoElement.track && t.mediaElement.videoElement.track.length){
						t.mediaElement.videoElement.track.remove();
					}
					t.mediaElement.videoElement.track = "";
					$(t.mediaElement.videoElement).html(track);
					t.mediaElement.videoElement.track = t.mediaElement.videoElement.find("track");

					classActiveOrInactive = "active";
				}else{
					classActiveOrInactive = "inactive";
				}

				selectOptions = "<div><button class="+classActiveOrInactive+" type='button' label="+value["label"]+" file="+value["file"]+">"+value["label"]+"</button></div>" ;
				addSubtitlesTrack(t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.popup.append(selectOptions));
			});

			t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.button.unbind().click(function(event){
				t.fullControls.bottomControlBar.bottomPlayerControls.closedcaption.popup.toggle();
			}.bind(t));

		},
		*/
		//create and append video title in top controls bar
		_buildvideotitle : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching video title");
			var t = this;
			var videoTitle = '<div class="sp-controls-top-video-title"><span class="sp-controls-top-video-title-text"></span></div>';
			t.fullControls.topContolbar.append(videoTitle);
			t.fullControls.topContolbar.videoTitle = t.fullControls.topContolbar.find('.sp-controls-top-video-title .sp-controls-top-video-title-text');
			t.fullControls.topContolbar.videoTitle.changeTitle = function(title){
				t.fullControls.topContolbar.videoTitle.html(title);
			}.bind(t);
			//change title to first index of array
			//t.fullControls.topContolbar.videoTitle.changeTitle(t.options.file[0].videotitle);
		},
		_buildbigicons : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching big icons");
			var t = this;
			var options = t.options;
			var media = t.mediaElement.videoElement;

			var poster = '<div class="sp-player-poster"><img></div>';
			var bigplay = '<div class="sp-player-bigplay"></div>';
			var loading = '<div class="sp-player-loading"></div>';
			var bigreplay = '<div class="sp-player-replay"></div>';

			t.playerLayers.append(poster);
			t.playerLayers.append(bigplay);
			t.playerLayers.append(loading);
			t.playerLayers.append(bigreplay);

			t.playerLayers.poster = t.playerLayers.find(".sp-player-poster");
			t.playerLayers.poster.img = t.playerLayers.poster.find("img");
			t.playerLayers.poster.changePoster = function(posterurl){
				$(t.playerLayers.poster.img).attr("src",posterurl);
			}.bind(t);
			//change poster to first index in a file array
			//t.playerLayers.poster.changePoster(t.options.file[0].poster);

			t.playerLayers.bigplay = t.playerLayers.find(".sp-player-bigplay");
			t.playerLayers.loading = t.playerLayers.find(".sp-player-loading");
			t.playerLayers.bigreplay = t.playerLayers.find(".sp-player-replay");

			if((t.options.autoplay === 'true') || (t.options.autoplay == true)){
				t.playerLayers.bigplay.hide();
				t.playerLayers.bigreplay.hide();
			}else{
				//when autoplay is false , we shall hide the loading,replay and play/pause icon to play standnby
				t.playerLayers.bigreplay.hide();
				t.playerLayers.loading.hide();
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.addClass("sp-pause");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-play");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.removeClass("sp-replay");
				t.fullControls.bottomControlBar.bottomPlayerControls.saranyuPlaypause.tooltip.html(SaranyuHlsHTML5Player.defaultOptions.titleStrings.play);
			}


			// //click event on player layer to pause and unpause
			// t.playerLayers.click(function(e){
			// 	e.preventDefault();
			// 	if(media.paused){
			// 		t._videoPlayerControls("play");
			// 	}else{
			// 		t._videoPlayerControls("pause");
			// 	}
			// });

			t.playerLayers.on("click", function(e){
					SaranyuHlsHTML5Player.bigPlayClickCounter++;  //count clicks
					if(SaranyuHlsHTML5Player.bigPlayClickCounter === 1) {
									SaranyuHlsHTML5Player.bigPlayClickCounterTimer = setTimeout(function() {
									if(media.paused){
										t._videoPlayerControls("play");
									}else{
										t._videoPlayerControls("pause");
									}
									SaranyuHlsHTML5Player.bigPlayClickCounter = 0;  //after action performed, reset counter
							}.bind(t), SaranyuHlsHTML5Player.bigPlayClickDELAY);
					} else {
							clearTimeout(SaranyuHlsHTML5Player.bigPlayClickCounterTimer);    //prevent single-click action
							t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.toggleFullscreen();
							SaranyuHlsHTML5Player.bigPlayClickCounter = 0;             //after action performed, reset counter
					}
			})
			.on("dblclick", function(e){
					e.preventDefault();  //cancel system double-click event
			});

			//adding event listners to show big icons
			media.addEventListener('play', function() {
				t.playerLayers.poster.hide();
				t.playerLayers.bigplay.hide();
				t.playerLayers.loading.hide();
				t.playerLayers.bigreplay.hide();
			});
			media.addEventListener('playing', function() {
				t.playerLayers.poster.hide();
				t.playerLayers.bigplay.hide();
				t.playerLayers.loading.hide();
				t.playerLayers.bigreplay.hide();
			});
			media.addEventListener('pause', function() {
				t.playerLayers.bigplay.show();
				t.playerLayers.loading.hide();
				t.playerLayers.bigreplay.hide();
			});

			media.addEventListener('waiting', function() {
				if(!media.paused){
					t.playerLayers.loading.show();
				}
			});

			media.addEventListener('ended', function() {
				t.playerLayers.bigreplay.show();
				t.playerLayers.bigplay.hide();
			});
		},
		_buildeventcallbacks : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching Event Callbacks");

			var t = this;
			var media = t.mediaElement.videoElement;
			t.eventcallbacks = {};

			media.addEventListener('ended', function() {
				//if ad is being played, then dont give false callback
				try{
					if(t._buildadvertisement.initializeAd.isLinear){
						return;
					}
				}catch(e){
				}

				try{
					t.eventcallbacks.onComplete(media.currentTime,media.duration,media.mediaId);
				}catch(e){
					SaranyuHlsHTML5Player.Utils.DLOG("callback events complete is not listened");
				}
			});

			media.addEventListener('pause', function() {
				//if ad is being played, then dont give false callback
				try{
					if(t._buildadvertisement.initializeAd.isLinear){
						return;
					}
				}catch(e){
				}


				try{
					t.eventcallbacks.onPause(media.currentTime,media.duration,media.mediaId);
				}catch(e){
					SaranyuHlsHTML5Player.Utils.DLOG("callback events Pause is not listened");
				}
			});

			media.addEventListener('play', function() {
				//if ad is being played, then dont give false callback
				try{
					if(t._buildadvertisement.initializeAd.isLinear){
						return;
					}
				}catch(e){
				}


				try{
					if(media.currentTime == 0){
						t.eventcallbacks.onPlay(media.currentTime,media.duration,media.mediaId);
					}else{
						t.eventcallbacks.onResume(media.currentTime,media.duration,media.mediaId);
					}
				}catch(e){
					SaranyuHlsHTML5Player.Utils.DLOG("callback events Play/Resume is not listened");
				}
			});

			media.addEventListener('seeked',function(){
				//if ad is being played, then dont give false callback
				try{
					if(t._buildadvertisement.initializeAd.isLinear){
						return;
					}
				}catch(e){
				}


				try{
					t.eventcallbacks.onSeeked(media.currentTime,media.duration,media.mediaId);
				}catch(e){
					SaranyuHlsHTML5Player.Utils.DLOG("callback events Seeked is not listened");
				}
			});
		},

		_buildhotkeys : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("Attaching Hotkeys");

			var t = this;
			var media = t.mediaElement.videoElement;

			//append feedback text element	in player overlays
			var feedbackTextElement = '<div class="sp-player-text-feedback-container"></div>'
			t.playerLayers.append(feedbackTextElement);
			t.playerLayers.feedbackTextElement = t.playerLayers.find(".sp-player-text-feedback-container");
			t.playerLayers.feedbackTextElement.hide();

			//add focus to element
			t.playerInner.attr('tabindex','0');

			t.playerInner.keydown(function(event){
				event.preventDefault();

				//if ad is being played, then disable hotkeys
				if(t._buildadvertisement.initializeAd.isLinear){
					return;
				}

				var charCode = (typeof event.which == "number") ? event.which : event.keyCode;

				if(charCode == 13 || charCode == 32){
					//space key or Enter Key
					SaranyuHlsHTML5Player.Utils.DLOG("Hotkey space/enter pressed which actions play/pause");

					if(media.paused){
						t._videoPlayerControls("play");
						//t.playerLayers.feedbackTextElement.html("Key pressed for play").stop(false,true).show().fadeOut(3000);
					}else{
						t._videoPlayerControls("pause");
						//t.playerLayers.feedbackTextElement.html("Key pressed for pause").stop(false,true).show().fadeOut(3000);
					}
				}else if(charCode == 109 || charCode == 77){
					//key M or m
					SaranyuHlsHTML5Player.Utils.DLOG("Hotkey M/m pressed which actions mute or unmute");

					   if(media.muted == true){
						    t._videoPlayerControls("unmute");
						    //t.playerLayers.feedbackTextElement.html("Key pressed for unmute").stop(false,true).show().fadeOut(3000);
					   }
					   else{
							t._videoPlayerControls("mute");
							//t.playerLayers.feedbackTextElement.html("Key pressed for mute").stop(false,true).show().fadeOut(3000);
					   }
				}else if(charCode == 70 || charCode == 102){
					//key F or f
					SaranyuHlsHTML5Player.Utils.DLOG("Hotkey F/f pressed which actions fullscreen toggle");

					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.toggleFullscreen();
				}else if(charCode == 117 || charCode == 85) {
					//Key U or u
					SaranyuHlsHTML5Player.Utils.DLOG("Hotkey up-arrow pressed which actions  volume increase");

					var volume = media.volume;
					volume+=.1;
					volume = Math.max(0, volume);
					volume = Math.min(volume, 1);
					t._videoPlayerControls("volumechange",volume);
					t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.positionVolumeHandle(volume);
					//t.playerLayers.feedbackTextElement.html("Key pressed for volume up").stop(false,true).show().fadeOut(3000);
				}
				else if(charCode == 100 || charCode == 68) {
					//Key D or d
					SaranyuHlsHTML5Player.Utils.DLOG("Hotkey down-arrow pressed which actions volume decrease");

					var volume = media.volume;
					volume -=.1;
					volume = Math.max(0, volume);
					volume = Math.min(volume, 1);
					t._videoPlayerControls("volumechange",volume);
					t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.positionVolumeHandle(volume);
					//t.playerLayers.feedbackTextElement.html("Key pressed for volume down").stop(false,true).show().fadeOut(3000);
				}
			});
		},
		_buildadvertisement : function(){
			SaranyuHlsHTML5Player.Utils.DLOG("building advertisement");

			var t = this;
			var options = t.options;
			var adFeatures = ['playpause','fullScreen','volume','title','time'];

			if(options.advertisement){

			// construct ad-player
			// play , pause , volume , fullscreen , video title , time

			var adTopControls = '<div class="sp-ad-top-controlbar"></div>';
			var adVideoElement = '<div class="sp-ad-video-element"></div>';
			var adBottomControls = '<div class="sp-ad-bottom-controlbar"></div>';
			var adDummyVideoTag = '<video class="sp-ad-dummy-video"></video>';

			t.adContainer.append(adDummyVideoTag);
			t.adContainer.append(adTopControls);
			t.adContainer.append(adVideoElement);
			t.adContainer.append(adBottomControls);


			t.adContainer.adTopControls = t.adContainer.find(".sp-ad-top-controlbar");
			t.adContainer.adVideoElement = t.adContainer.find(".sp-ad-video-element");
			t.adContainer.adBottomControls = t.adContainer.find(".sp-ad-bottom-controlbar");
			t.adContainer.adDummyVideoTag = t.adContainer.find(".sp-ad-dummy-video");

			t._buildadvertisement._buildadcue = function(){
					SaranyuHlsHTML5Player.Utils.DLOG("Building ad title icon for ad container");
					t._buildadvertisement._buildadcue.constructed = false;
					if(!t._buildadvertisement._buildadcue.constructed){

						try{
							t.fullControls.bottomControlBar.bottomProgressBar.progressbar.cues.empty();
						}catch(e){
						}

						$.each(t._buildadvertisement.adsets,function(index,value){
							if(Number(value.schedule)){
								//attaching event listner for video tag to build cues
								var leftMove = SaranyuHlsHTML5Player.Utils.getPercentageForGivenDuration(value.schedule,t.mediaElement.videoElement.duration);
								if(!(leftMove >= 0 && leftMove <=100)){
									return true;
								}
								var cueSpan = "<span class='sp-ad-cue-points sp-ad-cue-points-"+index+"' style='left:"+leftMove+"%'></span>";
								t.fullControls.bottomControlBar.bottomProgressBar.progressbar.cues.append(cueSpan);
								var cueAppend = t.fullControls.bottomControlBar.bottomProgressBar.progressbar.cues.find(".sp-ad-cue-points-"+index);
								t._buildadvertisement._buildadcue.constructed = true;
							}
						});
					}
			};


			t._buildadvertisement._buildadtitle = function(){
					SaranyuHlsHTML5Player.Utils.DLOG("Building ad title icon for ad container");
					var adTitle = '<div class="ad-video-title"><span class="ad-video-title-text"></span></div>'
					t.adContainer.adTopControls.append(adTitle);
					t.adContainer.adTopControls.adTitle = t.adContainer.adTopControls.find('.ad-video-title-text');
			};

			t._buildadvertisement._buildadplaypause = function(){
					SaranyuHlsHTML5Player.Utils.DLOG("Building playpause icon for ad container");
					var playpause = '<div class="sp-ad-button sp-ad-playpause sp-ad-play"><button></button></div>'
					t.adContainer.adBottomControls.append(playpause);
					t.adContainer.adBottomControls.playpause = t.adContainer.adBottomControls.find('.sp-ad-playpause');

					t.adContainer.adBottomControls.playpause.click(function(){
						SaranyuHlsHTML5Player.Utils.DLOG("AD play pause button clicked");
						try {
							if(!t._buildadvertisement.initializeAd.adPaused){
								t._buildadvertisement.initializeAd.adsManager.pause();
								t._buildadvertisement.initializeAd.adPaused = true;
							}else{
								t._buildadvertisement.initializeAd.adsManager.resume();
								t._buildadvertisement.initializeAd.adPaused = false;
							}
						}catch(e){
						}
					}.bind(t));

				t.adContainer.adBottomControls.playpause.changeIcon = function(){
						if(t._buildadvertisement.initializeAd.adPaused){
							t.adContainer.adBottomControls.playpause.removeClass("sp-ad-play").addClass("sp-ad-pause");
						}else{
							t.adContainer.adBottomControls.playpause.removeClass("sp-ad-pause").addClass("sp-ad-play");
						}
				};

			};

			t._buildadvertisement._buildadvolume = function(){
				SaranyuHlsHTML5Player.Utils.DLOG("Building volume icon for ad container");
				//crete and append volume mute button
				var volumeMuteUnmute = '<div class="sp-ad-button sp-ad-volume-muteunmute sp-ad-unmute"><button></button></div>';
				t.adContainer.adBottomControls.append(volumeMuteUnmute);
				t.adContainer.adBottomControls.volumeMuteUnmute = t.adContainer.adBottomControls.find('.sp-ad-volume-muteunmute');

				//create and append ad volume seekbar
				var volumeSlider = '<div class="sp-ad-volume-slider sp-ad-volume-slider-wrap"><div class="sp-ad-volume-current"></div><div class="sp-ad-volume-handle"></div></div>';
				t.adContainer.adBottomControls.append(volumeSlider);
				t.adContainer.adBottomControls.volumeSlider = t.adContainer.adBottomControls.find('.sp-ad-volume-slider.sp-ad-volume-slider-wrap');
				t.adContainer.adBottomControls.volumeSlider.volumeCurrent = t.adContainer.adBottomControls.volumeSlider.find('.sp-ad-volume-current');
				t.adContainer.adBottomControls.volumeSlider.volumeHandle = t.adContainer.adBottomControls.volumeSlider.find('.sp-ad-volume-handle');
				t.adContainer.adBottomControls.volumeSlider.oldVolume = 1;



				//align volume current and volume handle
				t.adContainer.adBottomControls.volumeSlider.positionVolumeHandle = function(volume){
					t.adContainer.adBottomControls.volumeSlider.volumeCurrent.css("width",volume *100 +"%");
					t.adContainer.adBottomControls.volumeSlider.volumeHandle.css("left","calc("+volume *100+"% - "+t.adContainer.adBottomControls.volumeSlider.volumeHandle.width() / 2+"px)");
				}

				//get value of volume bar position and change the <video> volume
				t.adContainer.adBottomControls.volumeSlider.handleVolumeMove = function(e){
					var volume = null,volumeTotal = t.adContainer.adBottomControls.volumeSlider, totalOffset = volumeTotal.offset();
					var railWidth = volumeTotal.width(), newX = e.pageX - totalOffset.left;
					volume = newX / railWidth;
					volume = Math.max(0, volume);
					volume = Math.min(volume, 1);
					t.adContainer.adBottomControls.volumeSlider.positionVolumeHandle(volume);
					try{
						t._buildadvertisement.initializeAd.adsManager.setVolume(volume);
						t.adContainer.adBottomControls.volumeSlider.oldVolume = volume;
					}catch(e){
					}
				}

				//event listner for volume slider
				t.adContainer.adBottomControls.volumeSlider.bind('mouseover', function(e) {
					e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					t.adContainer.adBottomControls.volumeSlider.mouseIsOver = true;
				}).bind('mousemove', function(e) {
					e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					if (t.adContainer.adBottomControls.volumeSlider.mouseIsDown == true) {
						t.adContainer.adBottomControls.volumeSlider.handleVolumeMove(e);
					}
				}).bind('mouseup', function(e) {
					e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					t.adContainer.adBottomControls.volumeSlider.mouseIsDown = false;
				}).bind('mousedown', function(e) {
					e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					t.adContainer.adBottomControls.volumeSlider.handleVolumeMove(e);
					t.adContainer.adBottomControls.volumeSlider.mouseIsDown = true;
				}).bind('mouseleave', function(e) {
					e = SaranyuHlsHTML5Player.Utils.preventSelectionOfTextInMouseMove(e);
					t.adContainer.adBottomControls.volumeSlider.mouseIsDown = false;
				});

				t.adContainer.adBottomControls.volumeMuteUnmute.click(function(){
					if(t._buildadvertisement.initializeAd.adMuted){
						if(t.adContainer.adBottomControls.volumeSlider.oldVolume >= 0 ){
							t._buildadvertisement.initializeAd.adsManager.setVolume(t.adContainer.adBottomControls.volumeSlider.oldVolume);
						}
						t._buildadvertisement.initializeAd.adsManager.setVolume(0.2);
						t._buildadvertisement.initializeAd.adMuted = false;
					}else{
						t._buildadvertisement.initializeAd.adsManager.setVolume(0);
						t._buildadvertisement.initializeAd.adMuted = true;
					}
				});

				t.adContainer.adBottomControls.volumeMuteUnmute.changeIcon = function(){
					if(t._buildadvertisement.initializeAd.adMuted){
						t.adContainer.adBottomControls.volumeMuteUnmute.addClass("sp-ad-mute").removeClass("sp-ad-unmute");
						t.adContainer.adBottomControls.volumeSlider.hide();
					}else{
						t.adContainer.adBottomControls.volumeMuteUnmute.addClass("sp-ad-unmute").removeClass("sp-ad-mute");
						t.adContainer.adBottomControls.volumeSlider.show();
					}
				};

				t.adContainer.adBottomControls.volumeMuteUnmute.checkDefaultContentVolume = function(){
					if(t.mediaElement.videoElement.muted){
						t.adContainer.adBottomControls.volumeMuteUnmute.removeClass("sp-ad-unmute").addClass("sp-ad-mute");
						t._buildadvertisement.initializeAd.adsManager.setVolume(0);
						t.adContainer.adBottomControls.volumeSlider.oldVolume = t.mediaElement.videoElement.volume;
						t.adContainer.adBottomControls.volumeSlider.positionVolumeHandle(t.adContainer.adBottomControls.volumeSlider.oldVolume);
						t._buildadvertisement.initializeAd.adMuted = true;
					}else{
						t.adContainer.adBottomControls.volumeMuteUnmute.removeClass("sp-ad-mute").addClass("sp-ad-unmute");
						t._buildadvertisement.initializeAd.adsManager.setVolume(t.mediaElement.videoElement.volume);
						t.adContainer.adBottomControls.volumeSlider.oldVolume = t.mediaElement.videoElement.volume;
						t.adContainer.adBottomControls.volumeSlider.positionVolumeHandle(t.adContainer.adBottomControls.volumeSlider.oldVolume);
						t._buildadvertisement.initializeAd.adMuted = false;
					}
				};
			};

			t._buildadvertisement._buildadtime = function(){
				SaranyuHlsHTML5Player.Utils.DLOG("Building time for ad container");

				var timeContainer = '<div class="sp-ad-player-time"><span class="sp-ad-plyr-currenttime">00:00</span>&nbsp;/&nbsp;<span class="sp-ad-plyr-duration">00:00</span></div>';
				t.adContainer.adBottomControls.append(timeContainer);
				t.adContainer.adBottomControls.timeContainer = t.adContainer.adBottomControls.find('.sp-ad-player-time');
				t.adContainer.adBottomControls.timeContainer.currentTime =  t.adContainer.adBottomControls.find('.sp-ad-plyr-currenttime');
				t.adContainer.adBottomControls.timeContainer.duration = t.adContainer.adBottomControls.find('.sp-ad-plyr-duration');


				t._buildadvertisement._buildadtime.changeCurrentTime = function(){
					try{
						var timeRemain = 0 ;
						if((t._buildadvertisement.initializeAd.ad.getDuration() - t._buildadvertisement.initializeAd.remainingTime) >= 0){
							timeRemain = t._buildadvertisement.initializeAd.ad.getDuration() - t._buildadvertisement.initializeAd.remainingTime;
						}else{
							timeRemain = 0
						}
						t.adContainer.adBottomControls.timeContainer.currentTime.html(SaranyuHlsHTML5Player.Utils.secondsToTimeCode(timeRemain));
					}catch(e){
					}
				};
				t._buildadvertisement._buildadtime.changeDuration = function(){
					try{
						t.adContainer.adBottomControls.timeContainer.duration.html(SaranyuHlsHTML5Player.Utils.secondsToTimeCode(t._buildadvertisement.initializeAd.ad.getDuration()));
					}catch(e){
					}
				};
			};

			t._buildadvertisement._buildadfullScreen = function(){
					SaranyuHlsHTML5Player.Utils.DLOG("Building playpause icon for ad container");

					var playpause = '<div class="sp-ad-button sp-ad-fullscreen-unfullscreen sp-ad-fullscreen"><button></button></div>'
					t.adContainer.adBottomControls.append(playpause);
					t.adContainer.adBottomControls.fullscreenunfullscreen = t.adContainer.adBottomControls.find('.sp-ad-fullscreen-unfullscreen');

					var isFullscreen = t.isFullScreen;
					if(isFullscreen){
						t.adContainer.adBottomControls.fullscreenunfullscreen.removeClass("sp-ad-fullscreen").addClass("sp-ad-unfullscreen");
					}else{
						t.adContainer.adBottomControls.fullscreenunfullscreen.removeClass("sp-ad-unfullscreen").addClass("sp-ad-fullscreen");
					}


				t.adContainer.adBottomControls.fullscreenunfullscreen.click(function(e){
					//change icon and trigger play pause of video element
					e.preventDefault();
					SaranyuHlsHTML5Player.Utils.DLOG("Clicked on FullScreen");
					t.fullControls.bottomControlBar.bottomPlayerControls.saranyuFullScreen.toggleFullscreen();

					setTimeout(function(){
						var isFullscreen = t.isFullScreen;
						if(isFullscreen){
							t.adContainer.adBottomControls.fullscreenunfullscreen.removeClass("sp-ad-fullscreen").addClass("sp-ad-unfullscreen");
						}else{
							t.adContainer.adBottomControls.fullscreenunfullscreen.removeClass("sp-ad-unfullscreen").addClass("sp-ad-fullscreen");
						}
					}.bind(t),600);
				}.bind(t));

				//getting to know if fullscreen exited by pressing "ESC"
/*
				t.playerInner.keyup(function(event){
					var charCode = event.keyCode;
					if(charCode == 27){
					setTimeout(function(){
						if(!isFullscreen){
							t.adContainer.adBottomControls.fullscreenunfullscreen.removeClass("sp-ad-unfullscreen").addClass("sp-ad-fullscreen");
						}
					}.bind(t),700);
					}
				});
*/

			};

		/*------------------ Ad Controls Start To Construct ------------------*/
		t._buildadvertisement._createAdControls = function() {
			SaranyuHlsHTML5Player.Utils.DLOG("_createAdControls");
			var t = this, features = adFeatures;

			//before creating controls delete the existing if any.
			t._buildadvertisement._destroyAdControls();

			for (featureIndex in features) {
				feature = features[featureIndex];
				SaranyuHlsHTML5Player.Utils.DLOG("ad feature found is "+feature);
				if (t._buildadvertisement['_buildad' + feature]) {
					try {
						t._buildadvertisement['_buildad' + feature]();
					} catch (e) {
						SaranyuHlsHTML5Player.Utils.DLOG(e);
					}
				} else {
					SaranyuHlsHTML5Player.Utils.DLOG("Error could not find function");
				}
			}
		 }.bind(t);

		 t._buildadvertisement._destroyAdControls = function() {
		 	SaranyuHlsHTML5Player.Utils.DLOG("_destroyAdControls");
		 	var t = this;

		 	//clear controls in adTopControls controlbar
		 	t.adContainer.adTopControls.empty();
		 	//clear controls in bottom controlbar
		 	t.adContainer.adBottomControls.empty();
		 	//clear controls in adVideoElement
		 	t.adContainer.adVideoElement.empty();

		 	try{
		 		//clear the ad cues if any
		 		t.fullControls.bottomControlBar.bottomProgressBar.progressbar.cues.empty();
		 	}catch(e){
		 	}

		 }.bind(t);

		 t._buildadvertisement._createAdControls();


		 t._buildadvertisement.initializeAd = function(adObj){

		 	//if any ad running then destroy it
		 	try{
		 		try{
		 			t.adContainer.adBottomControls.volumeMuteUnmute.checkDefaultContentVolume();
		 		}catch(e){
		 		}
		 		t._buildadvertisement.initializeAd.onAdError();
		 	}catch(e){
		 	}

		 	// Obtain ad
		 	// Pause the content, and start interval to keep pausing it
		 	// Attach event listner for elements
		 	// Start ad, show ad container
		 	// When ad completes , terminate interval , hide ad container

			// Copyright 2013 Google Inc. All Rights Reserved.
			// You may study, modify, and use this example for any purpose.
			// Note that this example is provided "as is", WITHOUT WARRANTY
			// of any kind either expressed or implied.

			t._buildadvertisement.initializeAd.adsManager;
			t._buildadvertisement.initializeAd.adsLoader;
			t._buildadvertisement.initializeAd.adDisplayContainer;
			t._buildadvertisement.initializeAd.intervalTimer;
			t._buildadvertisement.initializeAd.videoContent;
			t._buildadvertisement.initializeAd.adStarted = false;
			t._buildadvertisement.initializeAd.isLinear = false;
			t._buildadvertisement.initializeAd.adObj ;
			t._buildadvertisement.initializeAd.adPaused = false;
			t._buildadvertisement.initializeAd.adMuted = false;


			t._buildadvertisement.initializeAd.init = function(adObj){
			  t._buildadvertisement.initializeAd.videoContent = t.adContainer.adDummyVideoTag[0];
			  t._buildadvertisement.initializeAd.setUpIMA(adObj);
			}

			t._buildadvertisement.initializeAd.setUpIMA = function(adObj) {
			  // Create the ad display container.
			  t._buildadvertisement.initializeAd.createAdDisplayContainer();
			  // Create ads loader.
			  t._buildadvertisement.initializeAd.adsLoader = new google.ima.AdsLoader(t._buildadvertisement.initializeAd.adDisplayContainer);
			  // Listen and respond to ads loaded and error events.
			  t._buildadvertisement.initializeAd.adsLoader.addEventListener(
			      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
			      t._buildadvertisement.initializeAd.onAdsManagerLoaded,
			      false);
			  t._buildadvertisement.initializeAd.adsLoader.addEventListener(
			      google.ima.AdErrorEvent.Type.AD_ERROR,
			      t._buildadvertisement.initializeAd.onAdError,
			      false);

			  // Request video ads.
			  t._buildadvertisement.initializeAd.adsRequest = new google.ima.AdsRequest();
			  t._buildadvertisement.initializeAd.adsRequest.adTagUrl = adObj.adurl;


				  // Specify the linear and nonlinear slot sizes. This helps the SDK to
				  // select the correct creative if multiple are returned.

				  t._buildadvertisement.initializeAd.adsRequest.linearAdSlotWidth = t.adContainer.width();
				  t._buildadvertisement.initializeAd.adsRequest.linearAdSlotHeight = t.adContainer.height();

				  t._buildadvertisement.initializeAd.adsRequest.nonLinearAdSlotWidth = t.adContainer.width();
				  t._buildadvertisement.initializeAd.adsRequest.nonLinearAdSlotHeight = SaranyuHlsHTML5Player.maxNonLinearAdHeight;


			  	  t._buildadvertisement.initializeAd.adsLoader.requestAds(t._buildadvertisement.initializeAd.adsRequest);
			}.bind(t);


			t._buildadvertisement.initializeAd.createAdDisplayContainer = function() {

			  //empty the ad video element
			  try{
			  	t.adContainer.adVideoElement.empty();
			  }catch(e){
			  }

			  // We assume the adContainer is the DOM id of the element that will house
			  // the ads.
			  google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);
			  t._buildadvertisement.initializeAd.adDisplayContainer = new google.ima.AdDisplayContainer(t.adContainer.adVideoElement[0], t._buildadvertisement.initializeAd.videoContent[0]);
			}

			t._buildadvertisement.initializeAd.playAds = function() {

			  try{
				 		t.adContainer.addClass("sp-ad-container-display");
			  }catch(e){
			  }

			  // Initialize the container. Must be done via a user action on mobile devices.
			  t._buildadvertisement.initializeAd.videoContent.load();
			  t._buildadvertisement.initializeAd.adDisplayContainer.initialize();

			  try {
			    // Initialize the ads manager. Ad rules playlist will start at this time.
			    t._buildadvertisement.initializeAd.adsManager.init(t.adContainer.adVideoElement.width(), t.adContainer.adVideoElement.height(), google.ima.ViewMode.NORMAL);
			    // Call play to start showing the ad. Single video and overlay ads will
			    // start at this time; the call will be ignored for ad rules.
			    t._buildadvertisement.initializeAd.adsManager.start();
			  } catch (adError) {
			    // An error may be thrown if there was a problem with the VAST response.
			    t._buildadvertisement.initializeAd.videoContent.play();
			  }
			}

			t._buildadvertisement.initializeAd.onAdsManagerLoaded = function(adsManagerLoadedEvent){
			  // Get the ads manager.
			  t._buildadvertisement.initializeAd.adsRenderingSettings = new google.ima.AdsRenderingSettings();
			  //t._buildadvertisement.initializeAd.adsRenderingSettings.useStyledNonLinearAds = true;
			  //t._buildadvertisement.initializeAd.adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
			  // videoContent should be set to the content video element.
			  t._buildadvertisement.initializeAd.adsManager = adsManagerLoadedEvent.getAdsManager(
			      t._buildadvertisement.initializeAd.videoContent, t._buildadvertisement.initializeAd.adsRenderingSettings);

			  // Add listeners to the required events.
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdErrorEvent.Type.AD_ERROR,
			      t._buildadvertisement.initializeAd.onAdError);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			      t._buildadvertisement.initializeAd.onContentPauseRequested);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
			      t._buildadvertisement.initializeAd.onContentResumeRequested);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.CLICK,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.PAUSED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.RESUMED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.VOLUME_CHANGED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.VOLUME_MUTED,
			      t._buildadvertisement.initializeAd.onAdEvent);

			  // Listen to any additional events, if necessary.
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.LOADED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.STARTED,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.COMPLETE,
			      t._buildadvertisement.initializeAd.onAdEvent);
			  t._buildadvertisement.initializeAd.adsManager.addEventListener(
			      google.ima.AdEvent.Type.SKIPPED,
			      t._buildadvertisement.initializeAd.onAdEvent);

			  // Starting Ad playback
			  t._buildadvertisement.initializeAd.playAds();

			}

			t._buildadvertisement.initializeAd.onAdError = function(adErrorEvent){

			  // Handle the error logging.
			  try{
			  	SaranyuHlsHTML5Player.Utils.DLOG(adErrorEvent.getError());
			  }catch(e){
			  }

			  try{
			  	if(t._buildadvertisement.initializeAd.isLinear){
					SaranyuHlsHTML5Player.Utils.DLOG("Retaining volume status change made in ad player to content player");
					t._videoPlayerControls("volumechange",t.adContainer.adBottomControls.volumeSlider.oldVolume);
					t.fullControls.bottomControlBar.bottomPlayerControls.volumeSlider.positionVolumeHandle(t.adContainer.adBottomControls.volumeSlider.oldVolume);
					if(t._buildadvertisement.initializeAd.adMuted){
						t._videoPlayerControls("mute");
					}else{
						t._videoPlayerControls("unmute");
					}
			  	}
			  }catch(e){
			  }


			  try{
			  	t._buildadvertisement.initializeAd.adsManager.destroy();
			  }catch(e){
			  }

			  try{
	            clearInterval(t._buildadvertisement.initializeAd.intervalTimer);
			  }catch(e){
			  }

			  try{
			  	SaranyuHlsHTML5Player.Utils.DLOG("resetting ad container height");
			  	t.adContainer.height("100%");
			  }catch(e){
			  }

			  try{
				t.adContainer.removeClass("sp-ad-container-display");
			  }catch(e){
			  }

	          if(!(t._buildadvertisement.initializeAd.adObj.schedule == 'postroll')){
	        		t.mediaElement.videoElement.play();
	           }
			   else{
				   var nextIndexToBePlayer = Number(t.fullControls.playlistPanel.playingIndex) + 1;
					if(nextIndexToBePlayer < t.options.file.length){
					  t.mediaElement.videoElement.play();
				   }
			   }
	          t.adContainer.removeClass('sp-ad-active');
	          t.adContainer.removeClass('sp-ad-banner');
			  t._buildadvertisement.initializeAd.adStarted = false;
			  t._buildadvertisement.initializeAd.isLinear = false;
			}

			t._buildadvertisement.initializeAd.onAdEvent= function(adEvent) {
			  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
			  // don't have ad object associated.
			  t._buildadvertisement.initializeAd.ad = adEvent.getAd();
			  switch (adEvent.type) {
			    case google.ima.AdEvent.Type.LOADED:
			      // This is the first event sent for an ad - it is possible to
			      // determine whether the ad is a video ad or an overlay.
			      if (t._buildadvertisement.initializeAd.ad.isLinear()) {
			        // Position AdDisplayContainer correctly for video ad.
			        t._buildadvertisement.initializeAd.adStarted = true;
			        t._buildadvertisement.initializeAd.isLinear = true;
			        t.adContainer.addClass('sp-ad-active');
			        t.adContainer.adTopControls.adTitle.html(t._buildadvertisement.initializeAd.ad.getTitle());
			        t.adContainer.adBottomControls.volumeMuteUnmute.checkDefaultContentVolume();

			        // For a linear ad, a timer can be started to poll for
			        // the remaining time.
			        t._buildadvertisement.initializeAd.intervalTimer = setInterval(
			            function(){
			              t._buildadvertisement.initializeAd.remainingTime = t._buildadvertisement.initializeAd.adsManager.getRemainingTime();
			              t._buildadvertisement.initializeAd.remainingTime = (t._buildadvertisement.initializeAd.remainingTime >= 0)? t._buildadvertisement.initializeAd.remainingTime : 0;
			              t._buildadvertisement.initializeAd.adsManager.resize(t.adContainer.adVideoElement.width(), t.adContainer.adVideoElement.height(), google.ima.ViewMode.NORMAL);
			              t._buildadvertisement._buildadtime.changeCurrentTime();
			              t._buildadvertisement._buildadtime.changeDuration();

			              t.mediaElement.videoElement.pause();
			            }.bind(t),
			        300); // every 300ms
			      }else{
			      	// Position AdDisplayContainer correctly for overlay.
			        // Use ad.width and ad.height.
			        t._buildadvertisement.initializeAd.adStarted = true;
			        t._buildadvertisement.initializeAd.isLinear = false;
			        t.adContainer.addClass('sp-ad-banner');

			       	t.adContainer.adBottomControls.volumeMuteUnmute.checkDefaultContentVolume();

			        //decreasing the ad container width to ad-banner
			        t.adContainer.height(t._buildadvertisement.initializeAd.ad.getHeight()+10);

			        t._buildadvertisement.initializeAd.intervalTimer = setInterval(function(){
			              t._buildadvertisement.initializeAd.adsManager.resize(t.adContainer.adVideoElement.width(), t.adContainer.adVideoElement.height(), google.ima.ViewMode.NORMAL);
			            }.bind(t),
			        300);

			      	var bannerAdCloseBtn = '<div class="sp-ad-banner-closebtn">Close</div>'
			        t.adContainer.adVideoElement.append(bannerAdCloseBtn);
			        t.adContainer.adVideoElement.bannerAdCloseBtn = t.adContainer.adVideoElement.find('.sp-ad-banner-closebtn');
			        t.adContainer.adVideoElement.bannerAdCloseBtn.click(function(){
			        	t.adContainer.removeClass('sp-ad-banner');
			        	$(this).remove();
			        });
			      }
			      break;
			    case google.ima.AdEvent.Type.STARTED:
			      // This event indicates the ad has started - the video player
			      // can adjust the UI, for example display a pause button and
			      // remaining time.
				  alert("add started");
			      if (t._buildadvertisement.initializeAd.ad.isLinear()) {
			      }
			      break;
			    case google.ima.AdEvent.Type.CLICK:
			    	t._buildadvertisement.initializeAd.adsManager.pause();
			    break;
			    case google.ima.AdEvent.Type.PAUSED:
			    	t._buildadvertisement.initializeAd.adPaused = true;
			    	t.adContainer.adBottomControls.playpause.changeIcon();
			    break;
			    case google.ima.AdEvent.Type.RESUMED:
			    	t._buildadvertisement.initializeAd.adPaused = false;
			    	t.adContainer.adBottomControls.playpause.changeIcon();
			    break;
			    case google.ima.AdEvent.Type.VOLUME_CHANGED:
			    	if(t._buildadvertisement.initializeAd.adsManager.getVolume() == 0){
			    		t._buildadvertisement.initializeAd.adMuted = true;
			    	}else{
			    		t._buildadvertisement.initializeAd.adMuted = false;
			    		t.adContainer.adBottomControls.volumeSlider.positionVolumeHandle(t._buildadvertisement.initializeAd.adsManager.getVolume());
			    	}
			    	t.adContainer.adBottomControls.volumeMuteUnmute.changeIcon();
			    break;
			    case google.ima.AdEvent.Type.VOLUME_MUTED:
			    	t._buildadvertisement.initializeAd.adMuted = true;
			    	t.adContainer.adBottomControls.volumeMuteUnmute.changeIcon();
			    break;
			    case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
			    case google.ima.AdEvent.Type.COMPLETE:
			    case google.ima.AdEvent.Type.SKIPPED:
			      // This event indicates the ad has finished - the video player
			      // can perform appropriate UI actions, such as removing the timer for
			      // remaining time detection.
					t._buildadvertisement.initializeAd.onAdError();
			      break;
			  }
			}

			t._buildadvertisement.initializeAd.onContentPauseRequested =  function() {
			  t._buildadvertisement.initializeAd.videoContent.pause();
			  // This function is where you should setup UI for showing ads (e.g.
			  // display ad timer countdown, disable seeking etc.)
			  // setupUIForAds();
			}

			t._buildadvertisement.initializeAd.onContentResumeRequested = function () {
			  t._buildadvertisement.initializeAd.videoContent.play();
			  // This function is where you should ensure that your UI is ready
			  // to play content. It is the responsibility of the Publisher to
			  // implement this function when necessary.
			  // setupUIForContent();
			}

			//start fetching ad and start playback
			t._buildadvertisement.initializeAd.init(adObj);

		 }.bind(t);

		 // Get all adset info sent in contructor
		 t._buildadvertisement.adsets = options.advertisement.adsets;

		 t._buildadvertisement.adinvoker = function(){

		 	// invoke for pre-roll ad
		 	// sort mird-roll
		 	// invoke for post-roll ad
		 	t._buildadvertisement.adinvoker.peroll;
		 	t._buildadvertisement.adinvoker.midroll = [];
		 	t._buildadvertisement.adinvoker.postroll ;

			$.each(t._buildadvertisement.adsets,function(index,adObj){
		 		if(adObj.schedule == 'preroll'){
		 			SaranyuHlsHTML5Player.Utils.DLOG("Preroll ad has been invoked");
					alert("Preroll ad has been invoked"+adObj);
	 				t._buildadvertisement.initializeAd.adObj = adObj;
 					t._buildadvertisement.initializeAd(t._buildadvertisement.initializeAd.adObj);
 					t._buildadvertisement.adinvoker.peroll = true;
		 		}

		 		if(!isNaN(adObj.schedule)){
		 			adObj.flag = true;
					t._buildadvertisement.adinvoker.midroll.push(adObj);
		 		}

		 		if(adObj.schedule == 'postroll'){
		 			t.mediaElement.videoElement.addEventListener('ended',function(){
		 				if(!t._buildadvertisement.adinvoker.postroll){
		 					SaranyuHlsHTML5Player.Utils.DLOG("Postroll ad has been invoked");
		 					t._buildadvertisement.initializeAd.adObj = adObj;
		 					t._buildadvertisement.initializeAd(t._buildadvertisement.initializeAd.adObj);
		 					t._buildadvertisement.adinvoker.postroll = true;
		 				}else{
		 					SaranyuHlsHTML5Player.Utils.DLOG("Postroll ad has been played");
		 				}
		 			}.bind(t));
		 		}
		 	});

		 	if(t._buildadvertisement.adinvoker.midroll){
			 		t.mediaElement.videoElement.addEventListener('timeupdate',function(){

			 			if(t.options.advertisement.cues == 'true' && (!isNaN(t.mediaElement.videoElement.duration)) && (t.options.content == 'vod')){
			 				if(!t._buildadvertisement._buildadcue.constructed){
			 					t._buildadvertisement._buildadcue();
			 				}
			 			}

						$.each(t._buildadvertisement.adinvoker.midroll,function(index,value){
							var media = t.mediaElement.videoElement;
							if((media.currentTime >= Number(value.schedule)) && value.flag && (!media.paused)){
								SaranyuHlsHTML5Player.Utils.DLOG("midroll ad has been invoked with schedule "+Number(value.schedule));
								t._buildadvertisement.initializeAd.adObj = value;
								t._buildadvertisement.initializeAd(t._buildadvertisement.initializeAd.adObj);
								t._buildadvertisement.initializeAd.adObj.flag = false;
							}
						});
				}.bind(t));
		 	}

		 };

		 	// If pre-roll ad is detected then invoke ad it soon.
		 	// If mid-roll ad is dected then sort and wait for time, use flags as checkpoint
		 	// For post roll use videoelement.ended
		 	// Use flags for pre-roll, post-roll and mid-roll

				//IIFE to check and install Google IMA SDK
				(function loadGoogleImaSDK(){
					if(!SaranyuHlsHTML5Player.googleImaSDKLoaded){
						var googleIMA = document.createElement('script');
						googleIMA.type = "text/javascript";
						googleIMA.src = SaranyuHlsHTML5Player.googleImaSDKURL;
						document.getElementsByTagName('head')[0].appendChild(googleIMA);
						SaranyuHlsHTML5Player.googleImaSDKLoaded = true;
						SaranyuHlsHTML5Player.Utils.DLOG("Google IMA SDK Loaded");

						googleIMA.onload = function(){
							t._buildadvertisement.adinvoker();
						}.bind(t);
					}else{
						SaranyuHlsHTML5Player.Utils.DLOG("Google IMA SDK was Loaded already");
							t._buildadvertisement.adinvoker();
					}
				}.bind(t))();

		}
	},
		//video player controls
		_videoPlayerControls : function(operation,value){
			//alert("control received ")
			SaranyuHlsHTML5Player.Utils.DLOG("inside video controls function received command , "+operation+" with value of "+value);

			var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;

			switch (operation){
				case "play":
				    try{
					if(t.mediaElement.videoElement.saranyuHlsMertics.islive && (!(t.options.content.toLowerCase() == 'livedvr'))){
						media.currentTime  = media.duration - 3*t.mediaElement.videoElement.saranyuHlsMertics.targetduration;
					}
					}catch(e){}
					media.play();
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "pause":
					media.pause();
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "stop":
				    media.currentTime = 0;
					media.pause();
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "mute":
					media.muted = true;
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "unmute":
					media.muted = false;
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "volumechange":
					media.volume = value;
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;
				case "seek":
					media.currentTime = value;
					media.play();  //added by uday 11-12-2016
					SaranyuHlsHTML5Player.Utils.DLOG(operation+" to video player");
				break;

			}
		},

		_getCurrentTime : function (){
		   var t = this;
			var media = t.mediaElement.videoElement;
			var options = t.options;
			return media.currentTime;
		},


		_playcustomPlayList : function(file){

			SaranyuHlsHTML5Player.Utils.DLOG("Building custom playlist");
           // alert("Changing URL"+file);
			var t = this;
			var media = t.mediaElement.videoElement;
			t._createAndAppendHLStoPlayer(file);
			t._videoPlayerControls("play");
		},


		_isSupportedMSE :function () {
			window.MediaSource = window.MediaSource || window.WebKitMediaSource;
			return (window.MediaSource &&
					typeof window.MediaSource.isTypeSupported === 'function' &&
					window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'));
		},


		 _checkHLS: function () {
			 if( navigator.userAgent.match(/Android/i)
			 || navigator.userAgent.match(/webOS/i)
			 || navigator.userAgent.match(/iPhone/i)
			 || navigator.userAgent.match(/iPad/i)
			 || navigator.userAgent.match(/iPod/i)
			 || navigator.userAgent.match(/BlackBerry/i)
			 || navigator.userAgent.match(/Windows Phone/i)
			 )
			 {
				return true;
			 }
			 return false;
		 },

};
