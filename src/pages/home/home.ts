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

  autoJoin: boolean = false;




  videoAlreadyExist: boolean = false;
  readyToCall: boolean = false;
  isVideoStopped: boolean = true;
  connEstablished: boolean = false;

  remoteVideoContainerId: string = "";

  video: boolean = true;
  // create our webrtc connection
  webrtc: any;
  constructor(public navCtrl: NavController) {

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
    this.connEstablished = false;
    this.isLoggedIn = false;
    this.room = "";
  }

  ngAfterViewInit() {

  }


  startVideo() {
    console.log("Button clicked")

    this.webrtc.startLocalVideo();
    this.video = true;
    this.webrtc.config.media.video = true;


  }

  stopVideo() {
    console.log("stop Button clicked")
    this.webrtc.stopLocalVideo();
    this.video = false;
    this.webrtc.config.media.video = false;


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


  private initWebRTC() {
    this.webrtc = new SimpleWebRTC({
      // the id/element dom element that will hold "our" video
      localVideoEl: 'localVideo',
      // the id/element dom element that will hold remote videos
      remoteVideosEl: '',
      // immediately ask for camera access
      autoRequestMedia: true,
      debug: false,
      detectSpeakingEvents: true,
      autoAdjustMic: false,
      // turn off video
      media: { audio: true, video: this.video } // <------------- audio only

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
      console.log("room sucessfuly joined");

    });


    // a peer video has been added
    this.webrtc.on('videoAdded', (rtcVideo, peer) => {

      if (!this.webrtc.config.media.video) return;
      console.log('video added, peer:', peer);
      console.log('video added, video:', rtcVideo);


      var remotes = document.querySelector('#remotes');


      if (remotes) {
        if (!this.videoAlreadyExist) {
          var container = document.createElement('div');
          container.className = 'videoContainer';
          this.remoteVideoContainerId = 'container_' + this.webrtc.getDomId(peer);
          container.id = this.remoteVideoContainerId;

          container.appendChild(rtcVideo);
          this.videoAlreadyExist = true;
        } else {
          let container = document.getElementById(this.remoteVideoContainerId);
          container.appendChild(rtcVideo);
        }

        // suppress contextmenu
        rtcVideo.oncontextmenu = () => { return false; };

        // resize the video on click
        rtcVideo.onclick = function () {
          container.style.width = rtcVideo.videoWidth + 'px';
          container.style.height = rtcVideo.videoHeight + 'px';
          debugger;
        };

        // show the ice connection state
        if (peer && peer.pc) {
          var connstate = document.createElement('div');
          connstate.className = 'connectionstate';
          container.appendChild(connstate);
          peer.pc.on('iceConnectionStateChange', (event) => {
            switch (peer.pc.iceConnectionState) {
              case 'checking':
                connstate.innerText = 'Connecting to peer...';
                break;
              case 'connected':
              case 'completed': // on caller side
                // $(vol).show();
                connstate.innerText = 'Connection established.';
                this.connEstablished = true;
                break;
              case 'disconnected':
                console.warn("Disconnected");
                connstate.innerText = 'Disconnected.';
                //this.logOut();
                this.connEstablished = false;

                break;
              case 'failed':
                console.warn("Connection failed.");

                connstate.innerText = 'Connection failed.';
                this.logOut()

                break;
              case 'closed':
                console.warn("Connection closed.");

                connstate.innerText = 'Connection closed.';
                //this.logOut();

                break;
            }
          });
        } else {
          console.log("not peer and peer.pc")
        }
        remotes.appendChild(container);
      } else {
        console.log("remotes not found");
      }
    });
    // a peer was removed
    this.webrtc.on('videoRemoved', (video, peer) => {
      debugger;
      console.log('video removed ', peer);
      var remotes = document.getElementById('remotes');
      //TODO check localScreenContainer
      var el = document.getElementById(peer ? 'container_' + this.webrtc.getDomId(peer) : 'localScreenContainer');
      if (remotes && el) {
        remotes.removeChild(el);
        this.videoAlreadyExist = false;
      }
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
