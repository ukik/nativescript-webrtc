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

        this.exchangeSDP = 0

        this.connection = new TNSRTCPeerConnection();
        this.connection.onIceCandidate( event => {
            const candidate = event.candidate;

            if (!candidate) return;
            const object = {};
            object[ 'from' ] = this.me;
            object[ 'sdp' ] = candidate;
            // object[ 'sdpMid' ] = this.exchangeSDP.toString();
            // object[ 'sdpMLineIndex' ] = this.exchangeSDP;
            // object[ 'serverUrl' ] = candidate.serverUrl;

            object[ 'sdpMid' ] = candidate.sdpMid == null ? 0 : candidate.sdpMid;
            object[ 'sdpMLineIndex' ] = candidate.sdpMLineIndex == null ? 0 : candidate.sdpMLineIndex;

            // console.log('onicecandidate candidate.candidate '+this.exchangeSDP, candidate.candidate)
            // console.log('onicecandidate candidate.sdpMid '+this.exchangeSDP, candidate.sdpMid)
            // console.log('onicecandidate candidate.sdpMLineIndex '+this.exchangeSDP, candidate.sdpMLineIndex)
            
            // console.log('onicecandidate '+this.exchangeSDP, candidate)

            // console.log('emit onicecandidate object', object)
            // console.log('emit onicecandidate candidate', candidate)
            //console.log('setOnIceCandidateListener ' + candidate);
          
            this.socket.emit('iceCandidate', JSON.stringify(object));

            // this.exchangeSDP+=1

            // if(this.exchangeSDP>1){
            //     this.exchangeSDP=0
            // }
            //this.socket.emit( 'iceCandidate', object );
        } );
        this.connection.onTrack( track => {
            if ( track.streams ) {
                this.remoteView.srcObject = track.streams[ 0 ];
            }
        } );
        this.me = this.generateId();
        this.socket = new SocketIO( 'http://192.168.1.9:3001', {
            forceNew: true,
            secure: false
        } );
        this.socket.on( 'call:incoming', args => {
            console.log('call:incoming', args);

            const object = args;
            const payload = typeof(args.payload) == 'string' ? JSON.parse(args.payload) : args.payload
        
            console.log('call:incoming - payload', payload);
            this.checkSDP(payload, 'call:incoming - sdp')

            // const from = object['from'];
            const session = payload['sdp'];
            // const to = object['to'];

            // console.log( 'call:incoming' + ' to: ' + to + ' from: ' + from );
            // if ( to.indexOf( this.me ) > -1 ) {
                if ( this.localStream ) {
                    for ( let track of this.localStream.videoTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                    for ( let track of this.localStream.audioTracks ) {
                        this.connection.addTrack( track, [ this.localStream.id ] );
                    }
                }

                // this.createAnswerForOfferReceived( new TNSRTCSessionDescription({ sdp: session, type: TNSRTCSdpType.OFFER }) );
                this.createAnswerForOfferReceived( {
                    type: TNSRTCSdpType.OFFER,
                    sdp: session
                } );

                // mode 2
                // const sdp = new TNSRTCSessionDescription({ sdp: session, type: TNSRTCSdpType.OFFER });
                // this.createAnswerForOfferReceived2(sdp);                
            // }
        } );
        /*
        this.socket.on( 'call:answer', data => {
            // console.log( 'call:answer', data);
            const object = data;
            const from = object[ 'from' ];
            const session = object[ 'sdp' ];
            const to = object[ 'to' ];
            // console.log( 'call:answer' );
            // console.log( 'me : ' + this.me + ' from: ' + from + ' to: ' + to );
            // if ( to.indexOf( this.me ) > -1 ) {

                const sdp = new TNSRTCSessionDescription(TNSRTCSdpType.OFFER, sdp.sdp );
                // const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.OFFER, session );
                this.createAnswerForOfferReceived( sdp );

                // try {
                //     const sdp = new TNSRTCSessionDescription({ sdp: session, type: TNSRTCSdpType.OFFER });
                //     // this.createAnswerForOfferReceived(sdp);                
                //     this.createAnswerForOfferReceived2(sdp);          
                // } catch (error) {
                //     console.log(error);
                // }
                      
            // }
        } );
        */
        this.socket.on( 'call:answered', args => {
            console.log('call:answered', args);

            const object = args;
            const payload = JSON.parse(args.payload)
        
            console.log('call:answered - payload', payload);
            this.checkSDP(payload, 'call:answered - sdp')

            // const from = object['from'];
            const session = payload['sdp'];
            // const to = object['to'];

            // if ( to.indexOf( this.me ) > -1 ) {
                // console.log( 'call:answered' );
                
                const sdp = new TNSRTCSessionDescription(TNSRTCSdpType.ANSWER, session);
                // const sdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, session );
                this.handleAnswerReceived( sdp );

                // dataChannelCreate("osei");
                // dataChannelSend("osei", "Test", FancyWebRTC.DataChannelMessageType.TEXT);

                // try {
                //     const sdp = new TNSRTCSessionDescription({ sdp: session, type: TNSRTCSdpType.ANSWER });
                //     // this.handleAnswerReceived(sdp);                
                //     this.handleAnswerReceived2(sdp);              
                // } catch (error) {
                //     console.log(error);
                // }
                
            // }
        } );
        this.socket.on( 'call:iceCandidate', args => {
            console.log('call:iceCandidate', args);

            const object = args;
            const payload = JSON.parse(args.payload)
        
            console.log('call:iceCandidate - payload', payload);
            this.checkSDP(payload, 'call:iceCandidate - sdp')

            // const from = object[ 'from' ];
            const session = payload[ 'sdp' ];
            // const to = object[ 'to' ];
            const sdpMid = payload[ 'sdpMid' ].toString();
            const sdpMLineIndex = payload[ 'sdpMLineIndex' ];
            // const serverUrl = object[ 'serverUrl' ];
            // if ( to.indexOf( this.me ) > -1 ) {
                const candidate = new TNSRTCIceCandidate(
                    session,
                    sdpMid,
                    sdpMLineIndex
                );
                
                // console.log('call:iceCandidate candidate', candidate)
                // console.log('call:iceCandidate object', data)
                // if(object !== null) {
                //     this.connection.addIceCandidate( candidate );
                // }
                // this.connection.addIceCandidate( candidate );

            // }
            

            console.log('TNSRTCIceCandidate', TNSRTCIceCandidate)

            this.connection.addIceCandidate(candidate);
        } );
        this.socket.on( 'connect', data => {
            const object = {};
            object[ 'id' ] = this.me;
            this.socket.emit( 'init', object );
        } );
        this.socket.connect();
    }
    checkSDP(payload, label){
        if(payload.description) {
            console.log(label, payload.description.type);
        }
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
                    this.didReceiveError( error , 'makeCall');
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
        object[ 'sdp' ] = this.connection.localDescription //sdp.sdp; // ???
        object['description'] = this.connection.localDescription
        /* handleAnswerReceived(sdp); */
        this.socket.emit( 'answered', object );
    }

    sendInitiatorSdp( sdp ) {
        const object = {};
        object[ 'from' ] = this.me;
        object[ 'sdp' ] = this.connection.localDescription //sdp.sdp;
        object['description'] = this.connection.localDescription
        this.socket.emit( 'call', JSON.stringify(object) );
    }

    createAnswerForOfferReceived( remoteSdp ) {
        if ( !this.connection || !remoteSdp ) return;
        // console.log('remoteSdp', remoteSdp.sdp) 
        // console.log('remoteSdp', remoteSdp.type) 
        this.connection
            .setRemoteDescription(
                // new TNSRTCSessionDescription({ type: remoteSdp['type'], sdp: remoteSdp['sdp'] })
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
                        this.didReceiveError( e , 'createAnswerForOfferReceived 1');
                    } );
            } )
            .catch( error => {
                this.didReceiveError( error , 'createAnswerForOfferReceived 2');
            } );
    }


    handleAnswerReceived( sdp ) {
        if ( this.connection == null || sdp == null || this.inCall ) return;
        const newSdp = new TNSRTCSessionDescription(TNSRTCSdpType.ANSWER, sdp.sdp);
        // const newSdp = new TNSRTCSessionDescription( TNSRTCSdpType.ANSWER, sdp.sdp );
        this.connection
            .setRemoteDescription( newSdp )
            .then( () => {
                this.inCall = true;
            } )
            .catch( error => {
                this.didReceiveError( error , 'handleAnswerReceived');
            } );
    }


    setNonInitiatorLocalSdp( sdp ) {
        if ( this.connection == null ) return;
        this.connection
            .setLocalDescription( new TNSRTCSessionDescription(TNSRTCSdpType.ANSWER, sdp.sdp) )
            // .setLocalDescription( new TNSRTCSessionDescription( sdp.type, sdp.sdp ) )
            .then( () => {
                this.sendNonInitiatorSdp( sdp );
            } )
            .catch( error => {
                this.didReceiveError( error , 'setNonInitiatorLocalSdp');
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
                this.didReceiveError( error , 'setInitiatorLocalSdp');
            } );
    }

    dataChannelCreate( name ) {
        const dataChannelInit = {};
        const channel = this.connection.createDataChannel( name, dataChannelInit );
        // registerDataChannelObserver(name);
    }

    didReceiveError( error , label) {
        console.log(
            label + ' isInitiator: ' + this.isInitiator + ' didReceiveError: ' + error
        );
    }









    makeCall2(view) {
        if (this.connection != null) {
            this.isInitiator = true;
            // if (this.localStream != null) {
            //     for (let track of this.localStream.videoTracks) {
            //         this.connection.addTrack(track, this.localStream.id);
            //     }
            //     for (let track of this.localStream.audioTracks) {
            //         this.connection.addTrack(track, this.localStream.id);
            //     }
            // }
            
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

            new Promise(resolve => {
                // console.log('makeCall ' + this.connection);

                const description = this.connection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });

                resolve(description)
            })
            .then(description => {

                this.setInitiatorLocalSdp2(description);

            })
        }
    }
  


    handleRemoteDescriptionSet2() {
        for (let iceCandidate of this.remoteIceCandidates) {
            this.connection.addIceCandidate(iceCandidate);
        }
        this.remoteIceCandidates = [];
    }

    createAnswerForOfferReceived2(remoteSdp) {
        if (this.connection == null || remoteSdp == null) return;
        /* if (connection.getRemoteDescription() != null && (connection.getRemoteDescription().getType() == FancyRTCSdpType.ANSWER && remoteSdp.getType() == FancyRTCSdpType.ANSWER))
            return;
        */
    
        new Promise(resolve => {

            this.connection.setRemoteDescription(remoteSdp);
            resolve()
        })
        .then(() => {

            // console.log('createAnswerForOfferReceived: success', remoteSdp);
            this.handleRemoteDescriptionSet2();

        })
        .then(() => {

            // const description = this.connection.createAnswer({
            //     offerToReceiveVideo: true,
            //     offerToReceiveAudio: true
            // });
            // console.log('createAnswer: success');
            // setNonInitiatorLocalSdp(description);

            const description = this.connection.createAnswer( {
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            } )

            this.setNonInitiatorLocalSdp2( description );
        })
    }

    setNonInitiatorLocalSdp2(sdp) {
        if (this.connection == null) return;
        if (
            this.connection.localDescription != null &&
            (this.connection.localDescription.type === 'answer' && sdp.type === 'answer')
        ){
            return;
        }

        new Promise(resolve => {

            // console.log(' setNonInitiatorLocalSdp ', sdp);
            this.connection.setLocalDescription(sdp);

            resolve()
        })                
        .then(() => {
            // console.log(' setNonInitiatorLocalSdp : success');
            this.sendNonInitiatorSdp2( sdp );
        })
    }

    sendNonInitiatorSdp2(sdp) {
        // console.log('sendNonInitiatorSdp' + ' type: ' + sdp.type);
        const object = {};
        object['from'] = me;
        object['sdp'] = this.connection.localDescription //sdp.sdp; // ???
        /* handleAnswerReceived(sdp); */ 
        this.socket.emit('answered', JSON.stringify(object));
    }        

    handleAnswerReceived2(sdp) {
        if (this.connection == null || sdp == null || this.inCall) return;

        // console.log('handleAnswerReceived ' + sdp);

        const newSdp = new TNSRTCSessionDescription({ type: TNSRTCSdpType.ANSWER, sdp: sdp.sdp });

        new Promise(resolve => {

            this.connection.setRemoteDescription(newSdp);
            // console.log('handleAnswerReceived ' + newSdp);

            resolve()

        })
        .then(() => {

            // console.log('handleAnswerReceived: SUCCESS');
            this.inCall = true;
        })
    }


}






