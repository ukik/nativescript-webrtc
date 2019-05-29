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
        this.connection.onIceCandidate( candidate => {
            const object = {};
            object[ 'from' ] = this.me;
            object[ 'sdp' ] = candidate.sdp;
            object[ 'sdpMid' ] = candidate.sdpMid;
            object[ 'sdpMLineIndex' ] = candidate.sdpMLineIndex;
            object[ 'serverUrl' ] = candidate.serverUrl;
            this.socket.emit( 'iceCandidate', object );
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
        object[ 'from' ] = this.me;
        object[ 'sdp' ] = sdp.sdp; // ???
        /* handleAnswerReceived(sdp); */
        this.socket.emit( 'answered', object );
    }

    sendInitiatorSdp( sdp ) {
        const object = {};
        object[ 'from' ] = this.me;
        object[ 'sdp' ] = sdp.sdp;
        this.socket.emit( 'call', object );
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
