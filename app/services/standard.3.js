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
        this.connection.onicecandidate = function(event) {
            if (event.candidate != null) {
                // console.log("Send ICE", JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
                var data = JSON.stringify({ 'ice': event.candidate, 'uuid': this.me });
                this.socket.emit('iceCandidate', data);
            }            
        };
        // this.connection.onIceCandidate( event => {
        //     const object = {};
        //     object[ 'uuid' ] = this.me;
        //     object[ 'sdp' ] = event.sdp;
        //     object[ 'sdpMid' ] = event.sdpMid;
        //     object[ 'sdpMLineIndex' ] = event.sdpMLineIndex;
        //     object[ 'serverUrl' ] = event.serverUrl;

        //     var data = JSON.stringify(object);

        //     console.log('onIceCandidate', data)

        //     this.socket.emit( 'iceCandidate', data );
        // } );

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

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.sdp) {
                console.log("SIGNAL - call:incoming", signal.sdp);

                if ( this.localStream ) {
                    for ( let track of this.localStream.videoTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                    for ( let track of this.localStream.audioTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                }

                this.connection.setRemoteDescription(new TNSRTCSessionDescription(signal.sdp))
                    .then(function () {
                    // Only create answers in response to offers
                    if (signal.sdp.type == 'offer') {
                        this.connection.createAnswer()
                            .then(function (description) {
                            this.connection.setLocalDescription(description);
                        })
                        .then(function () {
        
                            var data = JSON.stringify({ 
                                'sdp': this.connection.localDescription, 
                                'uuid': this.me 
                            });
                            
                            socket.emit('answer', data);
        
                        })["catch"](this.errorHandler);
                    }
                })["catch"](this.errorHandler);


            //     this.connection
            //         .setRemoteDescription(
            //             new TNSRTCSessionDescription( TNSRTCSdpType.OFFER, signal.sdp )
            //         )
            //         .then( () => {
            //             this.handleRemoteDescriptionSet();
            //             this.connection
            //                 .createAnswer( {} )
            //                 .then( sdp => {

            //                     // if ( this.connection == null ) return;
            //                     this.connection
            //                         .setLocalDescription( new TNSRTCSessionDescription( sdp.type, sdp.sdp ) )
            //                         .then( () => {

            //                             // const object = {};
            //                             // object[ 'uuid' ] = this.me;
            //                             // object[ 'sdp' ] = sdp.sdp; // ???
            //                             /* handleAnswerReceived(sdp); */
                                
            //                             // var data = JSON.stringify(object);
                                
            //                             var data = JSON.stringify({ 
            //                                 'sdp': this.connection.localDescription, 
            //                                 'uuid': this.uuid 
            //                             });
                                
            //                             this.socket.emit( 'answer', data );   

            //                             // this.sendNonInitiatorSdp( sdp );
            //                         } )
            //                         .catch( error => {
            //                             this.didReceiveError( error );
            //                         } );

            //                     // this.setNonInitiatorLocalSdp( sdp );
            //                 } )
            //                 .catch( e => {
            //                     this.didReceiveError( e );
            //                 } );
            //         } )
            //         .catch( error => {
            //             this.didReceiveError( error );
            //         } );
            
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

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.sdp) {
                console.log("SIGNAL - call:answer", signal.sdp);

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

                                // const object = {};
                                // object[ 'uuid' ] = this.me;
                                // object[ 'sdp' ] = sdp.sdp; // ???
                                /* handleAnswerReceived(sdp); */
                        
                                // var data = JSON.stringify(object);

                                var data = JSON.stringify({ 
                                    'sdp': this.connection.localDescription, 
                                    'uuid': this.uuid 
                                });
                        
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

        // this.socket.on( 'call:answered', data => {
        //     var signal = JSON.parse(data);

        //     // Ignore messages from ourself
        //     if (signal.uuid == this.me) {
        //         //console.log(signal.uuid, uuid)
        //         return;
        //     }

        //     if (signal.sdp) {
        //         console.log("SIGNAL - call:answered", signal.sdp);

        //         const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, signal.sdp );

        //         // this.handleAnswerReceived( sdp );

        //         if ( this.connection == null || sdp == null || this.inCall ) return;
        //         const newSdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, sdp.sdp );
        //         this.connection
        //             .setRemoteDescription( newSdp )
        //             .then( () => {
        //                 this.inCall = true;
        //             } )
        //             .catch( error => {
        //                 this.didReceiveError( error );
        //             } );                
        //     }
        //     return
        //     const object = data;
        //     const from = object[ 'from' ];
        //     const session = object[ 'sdp' ];
        //     const to = object[ 'to' ];
        //     if ( to.indexOf( this.me ) > -1 ) {
        //         console.log( 'call:answered' );
        //         const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, session );
        //         this.handleAnswerReceived( sdp );
        //         // dataChannelCreate("osei");
        //         // dataChannelSend("osei", "Test", FancyWebRTC.DataChannelMessageType.TEXT);
        //     }
        // } );

        this.socket.on( 'call:iceCandidate', data => {

            var signal = JSON.parse(data);

            console.log("SIGNAL - call:iceCandidate", signal)

            // Ignore messages from ourself
            if (signal.uuid == this.me) {
                //console.log(signal.uuid, uuid)
                return;
            }

            if (signal.ice) {

                // const object = signal;

                // const session = object[ 'sdp' ];
                // const sdpMid = object[ 'sdpMid' ];
                // const sdpMLineIndex = object[ 'sdpMLineIndex' ];
                
                // const candidate = new TNSRTCIceCandidate(
                //     session,
                //     sdpMid,
                //     sdpMLineIndex
                // );
                // this.connection.addIceCandidate( candidate );

                // console.log("signal.ice ", signal.ice);
                this.connection.addIceCandidate(new TNSRTCIceCandidate(signal.ice))["catch"](this.errorHandler);
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

            // peerConnection.createOffer()
            //     .then(function (description) {
            //         peerConnection.setLocalDescription(description);
            //     })
            //     .then(function () {
            //         var data = JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid });
            //         socket.emit('call', data);
            //     })["catch"](errorHandler);

            this.connection
                .createOffer( {} )
                .then( sdp => {

                    // if ( !this.connection ) return;
                    // if ( this.connection.localDescription ) {
                    //     if (
                    //         this.connection.localDescription.type === TNSRTCSdpType.ANSWER &&
                    //         sdp.type === TNSRTCSdpType.ANSWER
                    //     )
                    //     return;
                    // }
            
       
                    this.connection
                        .setLocalDescription( sdp )
                        .then( () => {

                            // const object = {};
                            // object[ 'uuid' ] = this.me;
                            // object[ 'sdp' ] = sdp.sdp;

                            console.log('sdp', sdp);
                            console.log('this.connection.localDescription', this.connection.localDescription);
                            

                            var data = JSON.stringify({ 
                                'sdp': this.connection.localDescription, 
                                'uuid': this.me 
                            });
                    
                            this.socket.emit( 'call', data );

                            // this.sendInitiatorSdp( sdp );
                    } )
                    .catch( error => {
                        this.didReceiveError( error );
                    } );

                    // this.setInitiatorLocalSdp( sdp );
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
