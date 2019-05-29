import {
    SocketIO
} from 'nativescript-socketio';
import {
    TNSRTCIceCandidate,
    TNSRTCMediaDevices,
    TNSRTCMediaStream,
    TNSRTCMediaStreamConstraints,
    TNSRTCPeerConnection,
    TNSRTCSdpType,
    TNSRTCSessionDescription,
    WebRTC
} from 'nativescript-webrtc-plugin';

export class StandardService1 {
    constructor() {
        // this.socket = io('http://192.168.1.7:3001', {
        //     transports: ['websocket'],
        //     upgrade: false
        // });
        this.socket = null;
        this.localVideo = null;
        this.localStream = null;
        this.remoteVideo = null;
        this.peerConnection = null;
        this.uuid = null;
        this.serverConnection = null;
        this.peerConnectionConfig = {
            'iceServers': [
                { 'urls': 'stun:stun.stunprotocol.org:3478' },
                { 'urls': 'stun:stun.l.google.com:19302' },
            ]
        };

        this.uuid = this.createUUID();

        this.socket = new SocketIO( 'http://192.168.1.7:3001', {
            forceNew: true,
            secure: false
        } );  

        this.socket.on('call:incoming', data => {
            console.log('call:incoming', data);
            this.gotMessageFromServer(data);
        });
        this.socket.on('call:answer', data => {
            console.log('call:answer', data);
            this.gotMessageFromServer(data);
        });
        this.socket.on('call:answered', data => {
            // console.log('call:answered', event)
            // gotMessageFromServer(event)
        });
        this.socket.on('call:iceCandidate', data => {
            console.log('call:iceCandidate', data);
            this.gotMessageFromServer(data);
        });
        this.socket.on( 'connect', data => {
            const object = {};
            object[ 'id' ] = this.uuid;
            this.socket.emit( 'init', object );
        } );

        this.socket.connect();


        this.pageReady()
    }
    pageReady() {
        
        // localVideo = document.getElementById('localVideo');
        // remoteVideo = document.getElementById('remoteVideo');
        

        // var constraints = {
        //     video: true,
        //     audio: true
        // };
        // if (navigator.mediaDevices.getUserMedia) {
        //         navigator.mediaDevices
        //         .getUserMedia(constraints)
        //         .then(getUserMediaSuccess)["catch"](errorHandler);
        // }
        // else {
        //     alert('Your browser does not support getUserMedia API');
        // }
    }    

    init() {
        if ( !WebRTC.hasPermissions() ) {
            WebRTC.requestPermissions().then( () => {
                if ( WebRTC.hasPermissions() ) {
                    this.getUserMediaSuccess()
                }
            } );
        } else {
            this.getUserMediaSuccess()
        }
    }

    getUserMediaSuccess() {
        // localStream = stream;
        // localVideo.srcObject = stream;

        const video = new Map();
        video.set( 'facingMode', 'user' );
        video.set( 'width', 960 );
        video.set( 'height', 720 );
        const constraints = new TNSRTCMediaStreamConstraints( true, video );
        TNSRTCMediaDevices.getUserMedia( constraints )
            .then( mediaStream => {
                this.localStream = mediaStream;
                this.localVideo.srcObject = mediaStream;
            } )
            .catch( error => {
                console.log( error );
            } );
    }

    // window.onload = function (event) {
    //     pageReady();
    // };
    start(isCaller) {
        this.peerConnection = new TNSRTCPeerConnection();
        this.peerConnection.onicecandidate = this.gotIceCandidate;
        this.peerConnection.ontrack = this.gotRemoteStream;
        // this.peerConnection.addstream = (this.localStream);
        if (isCaller) {

            // if ( this.localStream ) {
            //     const videoTracks = this.localStream.videoTracks;
            //     const audioTracks = this.localStream.audioTracks;
            //     for ( let track of videoTracks ) {
            //         this.peerConnection.addTrack( track, [ this.localStream.id ] );
            //     }
            //     for ( let track of audioTracks ) {
            //         this.peerConnection.addTrack( track, [ this.localStream.id ] );
            //     }
            // }

            this.peerConnection.createOffer()
                .then(function (description) {
                    this.peerConnection.setLocalDescription(description);
            })
                .then(function () {
                var data = JSON.stringify({ 'sdp': this.peerConnection.localDescription, 'uuid': this.uuid });
                socket.emit('call', data);
            })["catch"](this.errorHandler);
        }



        // if ( this.connection ) {
        //     this.isInitiator = true;
        //     if ( this.localStream ) {
        //         const videoTracks = this.localStream.videoTracks;
        //         const audioTracks = this.localStream.audioTracks;
        //         for ( let track of videoTracks ) {
        //             this.connection.addTrack( track, [ this.localStream.id ] );
        //         }
        //         for ( let track of audioTracks ) {
        //             this.connection.addTrack( track, [ this.localStream.id ] );
        //         }
        //     }
        //     this.connection
        //         .createOffer( {} )
        //         .then( sdp => {
        //             this.setInitiatorLocalSdp( sdp );
        //         } )
        //         .catch( error => {
        //             this.didReceiveError( error );
        //         } );
        // }        


    }
    gotMessageFromServer(message) {
        if (!this.peerConnection)
            this.start(false);

        var signal;
        if (message.data == undefined) {
            signal = JSON.parse(message);
        }

        else {
            signal = JSON.parse(message.data);
        }
        // Ignore messages from ourself
        if (signal.uuid == this.uuid) {
            //console.log(signal.uuid, uuid)
            return;
        }
        if (signal.sdp) {
            console.log("signal.sdp ", signal.sdp);
            this.peerConnection
                .setRemoteDescription(new TNSRTCSessionDescription(signal.sdp))
                .then(function () {
                // Only create answers in response to offers
                if (signal.sdp.type == 'offer') {
                    this.peerConnection.createAnswer()
                        .then(function (description) {
                        this.peerConnection.setLocalDescription(description);
                    })
                    .then(function () {
                        var data = JSON.stringify({ 'sdp': this.peerConnection.localDescription, 'uuid': this.uuid });
                        socket.emit('answer', data);
                    })["catch"](this.errorHandler);
                }
            })["catch"](this.errorHandler);
        }
        else if (signal.ice) {
            console.log("signal.ice ", signal.ice);
            this.peerConnection.addIceCandidate(new TNSRTCIceCandidate(signal.ice))["catch"](this.errorHandler);
        }
    }
    gotIceCandidate(event) {
        if (event.candidate != null) {
            // console.log("Send ICE", JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));

            var data = JSON.stringify({ 'ice': event.candidate, 'uuid': this.uuid });
            socket.emit('iceCandidate', data);

        }
    }
    gotRemoteStream(event) {
        console.log('got remote stream');
        this.remoteVideo.srcObject = event.streams[0];
    }

    // this.connection.onTrack( track => {
    //     if ( track.streams ) {
    //         this.remoteView.srcObject = track.streams[ 0 ];
    //     }
    // } );


    errorHandler(error) {
        console.log(error);
    }
    // Taken from http://stackoverflow.com/a/105074/515584
    // Strictly speaking, it's not a real UUID, but it gets the job done here
    createUUID() {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
            const r = ( Math.random() * 16 ) | 0,
                v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
            return v.toString( 16 );
        } );

        // function s4() {
        //     return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        // }
        // return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    
}

export class StandardService {
    constructor() {
        this.localView = null;
        this.remoteView = null;
        this.connection = null;
        this.socket = null;
        this.me = null;
        this.localStream = null;
        this.dataChannels = new Map();
        this.remoteIceCandidates = [];
        this.inCall = false;
        this.isInitiator = false;

        this.connection = new TNSRTCPeerConnection();
        this.connection.onIceCandidate( candidate => {
            // const object = {};
            // object[ 'from' ] = this.me;
            // object[ 'sdp' ] = candidate.sdp;
            // object[ 'sdpMid' ] = candidate.sdpMid;
            // object[ 'sdpMLineIndex' ] = candidate.sdpMLineIndex;
            // object[ 'serverUrl' ] = candidate.serverUrl;

            var data = JSON.stringify({ 'ice': candidate, 'uuid': this.me });

            this.socket.emit( 'iceCandidate', data );
        } );

        this.connection.onTrack( track => {
            if ( track.streams ) {
                this.remoteView.srcObject = track.streams[ 0 ];
            }
        } );

        this.me = this.generateId();
        this.socket = new SocketIO( 'http://192.168.1.7:3001', {
            forceNew: true,
            secure: false
        } );

        this.socket.on( 'call:incoming', data => {

            var signal = JSON.parse(data);
            const session = signal[ 'sdp' ];

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.sdp) {
                console.log("signal.sdp ", signal.sdp);

                this.connection
                    .setRemoteDescription(
                        new TNSRTCSessionDescription( TNSRTCSdpType.OFFER, signal.sdp )
                    )
                    .then( () => {
                        this.handleRemoteDescriptionSet();
                        this.connection
                            .createAnswer( {} )
                            .then( sdp => {

                                if ( this.connection == null ) return;
                                this.connection
                                    .setLocalDescription( new TNSRTCSessionDescription( sdp.type, sdp.sdp ) )
                                    .then( () => {

                                        const object = {};
                                        object[ 'uuid' ] = this.me;
                                        object[ 'sdp' ] = sdp.sdp; // ???
                                        /* handleAnswerReceived(sdp); */
                                
                                        var data = JSON.stringify(object);
                                
                                        this.socket.emit( 'answer', data );                                        
                                        // this.sendNonInitiatorSdp( sdp );
                                    } )
                                    .catch( error => {
                                        this.didReceiveError( error );
                                    } );

                                // this.setNonInitiatorLocalSdp( sdp );
                            } )
                            .catch( e => {
                                this.didReceiveError( e );
                            } );
                    } )
                    .catch( error => {
                        this.didReceiveError( error );
                    } );

            }

            return
            const object = data;
            const from = object[ 'from' ];
            const session = object[ 'sdp' ];
            const to = object[ 'to' ];
            console.log( 'call:incoming' + ' to: ' + to + ' from: ' + from );
            if ( to.indexOf( this.me ) > -1 ) {
                if ( this.localStream ) {
                    for ( let track of this.localStream.videoTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                    for ( let track of this.localStream.audioTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                }
                this.createAnswerForOfferReceived( {
                    type: TNSRTCSdpType.OFFER,
                    sdp: session
                } );
            }
        } );

        this.socket.on( 'call:answer', data => {
            var signal = JSON.parse(data);
            const session = signal[ 'sdp' ];

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.sdp) {
                console.log("signal.sdp ", signal.sdp);

                const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.OFFER, signal.sdp );

                // this.createAnswerForOfferReceived( sdp );

                if ( !this.connection || !remoteSdp ) return;

                this.connection
                    .setRemoteDescription(
                        new TNSRTCSessionDescription( sdp.type, sdp.sdp )
                    )
                    .then( () => {
                        this.handleRemoteDescriptionSet();
                        this.connection
                            .createAnswer( {} )
                            .then( sdp => {

                                const object = {};
                                object[ 'uuid' ] = this.me;
                                object[ 'sdp' ] = sdp.sdp; // ???
                                /* handleAnswerReceived(sdp); */
                        
                                var data = JSON.stringify(object);
                        
                                this.socket.emit( 'answer', data );                                        
                                // this.sendNonInitiatorSdp( sdp );
                            } )
                            .catch( e => {
                                this.didReceiveError( e );
                            } );
                    } )
                    .catch( error => {
                        this.didReceiveError( error );
                    } );

            }

            return
            const object = data;
            const from = object[ 'from' ];
            const session = object[ 'sdp' ];
            const to = object[ 'to' ];
            console.log( 'call:answer' );
            console.log( 'me : ' + this.me + ' from: ' + from + ' to: ' + to );
            if ( to.indexOf( this.me ) > -1 ) {
                const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.OFFER, session );
                this.createAnswerForOfferReceived( sdp );
            }
        } );

        this.socket.on( 'call:answered', data => {
            var signal = JSON.parse(data);
            const session = signal[ 'sdp' ];

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.sdp) {
                console.log("signal.sdp ", signal.sdp);

                const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, signal.sdp );

                // this.handleAnswerReceived( sdp );

                if ( this.connection == null || sdp == null || this.inCall ) return;
                const newSdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, sdp.sdp );
                this.connection
                    .setRemoteDescription( newSdp )
                    .then( () => {
                        this.inCall = true;
                    } )
                    .catch( error => {
                        this.didReceiveError( error );
                    } );                
            }
            return
            const object = data;
            const from = object[ 'from' ];
            const session = object[ 'sdp' ];
            const to = object[ 'to' ];
            if ( to.indexOf( this.me ) > -1 ) {
                console.log( 'call:answered' );
                const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, session );
                this.handleAnswerReceived( sdp );
                // dataChannelCreate("osei");
                // dataChannelSend("osei", "Test", FancyWebRTC.DataChannelMessageType.TEXT);
            }
        } );

        this.socket.on( 'call:iceCandidate', data => {

            var signal = JSON.parse(data);

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.ice) {
                console.log("signal.ice ", signal.ice);
                this.connection.addIceCandidate(new TNSRTCIceCandidate(signal.ice))["catch"](errorHandler);
            }

            return

            console.log( 'call:iceCandidate' );
            const object = data;

            const from = object[ 'from' ];
            const session = object[ 'sdp' ];
            const to = object[ 'to' ];
            const sdpMid = object[ 'sdpMid' ];
            const sdpMLineIndex = object[ 'sdpMLineIndex' ];
            const serverUrl = object[ 'serverUrl' ];
            if ( to.indexOf( this.me ) > -1 ) {
                const candidate = new TNSRTCIceCandidate(
                    session,
                    sdpMid,
                    sdpMLineIndex
                );
                this.connection.addIceCandidate( candidate );
            }
        } );

        this.socket.on( 'connect', data => {
            const object = {};
            object[ 'id' ] = this.me;
            this.socket.emit( 'init', object );
        } );

        this.socket.connect();
    }

    init() {
        if ( !WebRTC.hasPermissions() ) {
            WebRTC.requestPermissions().then( () => {
                if ( WebRTC.hasPermissions() ) {
                    this.setUpUserMedia();
                }
            } );
        } else {
            this.setUpUserMedia();
        }
    }

    generateId() {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
            const r = ( Math.random() * 16 ) | 0,
                v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
            return v.toString( 16 );
        } );
    }

    setUpUserMedia() {
        const video = new Map();
        video.set( 'facingMode', 'user' );
        video.set( 'width', 960 );
        video.set( 'height', 720 );
        const constraints = new TNSRTCMediaStreamConstraints( true, video );
        TNSRTCMediaDevices.getUserMedia( constraints )
            .then( mediaStream => {
                this.localStream = mediaStream;
                this.localView.srcObject = mediaStream;
            } )
            .catch( error => {
                console.log( error );
            } );
    }

    makeCall( view ) {
        if ( this.connection ) {
            this.isInitiator = true;
            if ( this.localStream ) {
                const videoTracks = this.localStream.videoTracks;
                const audioTracks = this.localStream.audioTracks;
                for ( let track of videoTracks ) {
                    this.connection.addTrack( track, [ this.localStream.id ] );
                }
                for ( let track of audioTracks ) {
                    this.connection.addTrack( track, [ this.localStream.id ] );
                }
            }
            this.connection
                .createOffer( {} )
                .then( sdp => {
                    this.setInitiatorLocalSdp( sdp );
                } )
                .catch( error => {
                    this.didReceiveError( error );
                } );
        }
    }

    answerCall( view ) {}

    endCall( view ) {
        this.connection.close();
        this.connection.dispose();
    }

    handleRemoteDescriptionSet() {
        for ( let iceCandidate of this.remoteIceCandidates ) {
            this.connection.addIceCandidate( iceCandidate );
        }
        this.remoteIceCandidates = [];
    }

    sendNonInitiatorSdp( sdp ) {
        const object = {};
        object[ 'uuid' ] = this.me;
        object[ 'sdp' ] = sdp.sdp; // ???
        /* handleAnswerReceived(sdp); */

        var data = JSON.stringify(object);

        this.socket.emit( 'answer', data );
    }

    sendInitiatorSdp( sdp ) {
        const object = {};
        object[ 'uuid' ] = this.me;
        object[ 'sdp' ] = sdp.sdp;

        var data = JSON.stringify(object);

        this.socket.emit( 'call', data );
    }

    createAnswerForOfferReceived( remoteSdp ) {
        if ( !this.connection || !remoteSdp ) return;
        this.connection
            .setRemoteDescription(
                new TNSRTCSessionDescription( remoteSdp.type, remoteSdp.sdp )
            )
            .then( () => {
                this.handleRemoteDescriptionSet();
                this.connection
                    .createAnswer( {} )
                    .then( sdp => {
                        this.setNonInitiatorLocalSdp( sdp );
                    } )
                    .catch( e => {
                        this.didReceiveError( e );
                    } );
            } )
            .catch( error => {
                this.didReceiveError( error );
            } );
    }

    handleAnswerReceived( sdp ) {
        if ( this.connection == null || sdp == null || this.inCall ) return;
        const newSdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, sdp.sdp );
        this.connection
            .setRemoteDescription( newSdp )
            .then( () => {
                this.inCall = true;
            } )
            .catch( error => {
                this.didReceiveError( error );
            } );
    }

    setNonInitiatorLocalSdp( sdp ) {
        if ( this.connection == null ) return;
        this.connection
            .setLocalDescription( new TNSRTCSessionDescription( sdp.type, sdp.sdp ) )
            .then( () => {
                this.sendNonInitiatorSdp( sdp );
            } )
            .catch( error => {
                this.didReceiveError( error );
            } );
    }

    setInitiatorLocalSdp( sdp ) {
        if ( !this.connection ) return;
        if ( this.connection.localDescription ) {
            if (
                this.connection.localDescription.type === TNSRTCSdpType.ANSWER &&
                sdp.type === TNSRTCSdpType.ANSWER
            )
            return;
        }

        this.connection
            .setLocalDescription( sdp )
            .then( () => {
                this.sendInitiatorSdp( sdp );
            } )
            .catch( error => {
                this.didReceiveError( error );
            } );
    }

    dataChannelCreate( name ) {
        const dataChannelInit = {};
        const channel = this.connection.createDataChannel( name, dataChannelInit );
        // registerDataChannelObserver(name);
    }

    didReceiveError( error ) {
        console.log(
            'isInitiator: ' + this.isInitiator + ' didReceiveError: ' + error
        );
    }
}
