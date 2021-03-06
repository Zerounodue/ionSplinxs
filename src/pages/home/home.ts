import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';


declare var SimpleWebRTC: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  isLoggedIn: boolean = false;

  // grab the room from the URL
  //var room = location.search && location.search.split('?')[1];
  room: string = "";

  autoJoin: boolean = true;


  peer: any = null;
  myUserName: string;

  userTapped: boolean = false;

  readyToCall: boolean = false;
  isVideoStopped: boolean = true;
  connEstablished: boolean = false;

  remoteVideoContainerId: string = "";

  video: boolean = false;
  // create our webrtc connection
  webrtc: any;
  constructor(public navCtrl: NavController) {

  }
  toggleVideo() {
    this.video = !this.video;
  }

  logVideo() {
    console.log("this.vide:" + this.video)
  }

  joinRoom() {
    if (this.readyToCall) {
      if (this.room) this.webrtc.joinRoom(this.room);
    }
    else {
      alert("not ready to call");
    }
  }

  logOut() {

    this.webrtc.leaveRoom();

    this.webrtc.disconnect();
    this.connEstablished = false;
    this.isLoggedIn = false;
    this.room = "";
  }

  ngAfterViewInit() {

  }
  videoChangedTap() {

    this.userTapped = true;

  }
  videoChanged() {
    //if the user tapped, send a a messag, if the user has not tapped, it recived a message.
    if (this.userTapped) {
      this.userTapped = false;
      this.peer.send('videoChanged', { video: this.video })
    }

    this.webrtc.config.media.video = this.video;
    this.webrtc.webrtc.config.media.video = this.video;



  }
  startVideo() {
    console.log("Button startVideo clicked, this.webrtc.config.media.video")


    console.log(this.webrtc.config.media.video);

    this.webrtc.startLocalVideo();
    //  this.webrtc.config.media.video = true;
    //


  }

  stopVideo() {
    console.log("stop Button clicked")
    this.webrtc.stopLocalVideo();
    this.video = false;
    //this.webrtc.config.media.video = false;


  }

  signIn() {
    if (this.room != "") {

      this.initWebRTC();
      this.isLoggedIn = true;

      //this.joinRoom();
    }
    else {
      alert("Enter a room name");
    }

  }


  initWebRTC() {
    this.webrtc = new SimpleWebRTC({
      // the id/element dom element that will hold "our" video
      localVideoEl: 'localVideo',
      // the id/element dom element that will hold remote videos
      remoteVideosEl: 'remoteVideo',
      // immediately ask for camera access
      autoRequestMedia: true,
      debug: false,
      detectSpeakingEvents: true,
      autoAdjustMic: false,
      // turn off video
      media: { audio: true, video: this.video } // <------------- audio only or also video?

    });

    // when it's ready, join if we got a room from the URL
    this.webrtc.on('readyToCall', () => {
      // you can name it anything
      console.log("WebRTC is ready to call")
      this.readyToCall = true;
      if (this.autoJoin) { this.joinRoom() }
    });


    // we got access to the camera
    this.webrtc.on('localStream', (stream) => {
      console.log("got local stream")

    });
    // we did not get access to the camera
    this.webrtc.on('localMediaError', (err) => { console.error("local media error: " + err) });
    this.webrtc.on('joinedRoom', (name) => {
      console.log("room sucessfuly joined: " + name);

    });

    this.webrtc.on('createdPeer', (peer) => {


      console.log("message createdPeer: " + peer);
      console.log(peer);

      //since we are connected always to maximum 1 peer, we can store it in a normal variable (instead of an array of peers)
      this.peer = peer;
      this.connEstablished = true;

    });

    this.webrtc.on('connectionReady', (Sessionid) => {
      console.log("connectionReady, sessionId: " + Sessionid);
      this.myUserName = Sessionid;

    });

    //not useful
    /*
        this.webrtc.on('message', (message) => {
          console.log("message: ");
          console.log(message);
    
    
        });
    
        this.webrtc.on('channelMessage', (message) => {
          if (message.type != 'video') {
            console.log("channelMessage: ");
            console.log(message);
          }
        });
    */

    this.webrtc.connection.on('message', (message) => {
      //console.log("connection message: ");
      //console.log(message);
      if (message.to == this.myUserName) {


        console.log("recived a message addressed to me :)");
        if (message.type == 'videoChanged') {
          console.log("message videoChanged recived")
          //console.log(message);
          //recived a message tha tells me to set the video variable to the recived value
          console.log(message.payload.video);
          this.video = message.payload.video;


          //this.video = !this.video;
          //this.peer.send('videoChanged', { video: this.video })

        }
      }


    });



    // a peer video has been added
    this.webrtc.on('videoAdded', (rtcVideo, peer) => {

      // if (!this.webrtc.config.media.video) return;
      console.log('video added, peer:', peer);
      console.log('video added, video:', rtcVideo);

      console.log("offet ro recive:");
      console.log(this.webrtc.config.receiveMedia);
      console.log("media:");

      //why is this still false when the remote peer recives add
      console.log(this.webrtc.config.media);
      console.log(this.webrtc.webrtc.config.media);



    });
    // a peer was removed
    this.webrtc.on('videoRemoved', (video, peer) => {
      console.log("video removed :(")



      //var remoteVideo = document.getElementById('remoteVideo');
      //debugger;
      console.log(this.webrtc.getDomId(peer));
      /*
      var el = document.getElementById(peer ? 'container_' + this.webrtc.getDomId(peer) : 'localVideo');
      debugger;
      if (remoteVideo && el) {
        remoteVideo.removeChild(el);
    
      }
      */

    });

    // local p2p/ice failure
    this.webrtc.on('iceFailed', (peer) => {
      var connstate = document.querySelector('#container_' + this.webrtc.getDomId(peer) + ' .connectionstate');
      console.log('local fail', connstate);
      if (connstate) {
        alert('Connection failed.');
        //fileinput.disabled = 'disabled';
      }
    });
  }


}
