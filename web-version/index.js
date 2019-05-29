var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var socket = io('http://192.168.1.9:3001', {
    transports: ['websocket'],
    upgrade: false
});
var localStream;
var connection;
var isInitiator = false;
var remoteIceCandidates = [];
var inCall = false;
var localVideo;
var remoteVideo;
function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
var me = getUUID();
var iceServers = [];
var turnServerOne = {
    urls: ['turn:192.158.29.39:3478?transport=udp'],
    username: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    credential: '28224511:1379330808',
    credentialType: 'password'
};
var turnServerTwo = {
    urls: ['turn:192.158.29.39:3478?transport=tcp'],
    username: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    credential: '28224511:1379330808'
};
var turnServerThree = {
    urls: ['turn:numb.viagenie.ca'],
    username: 'muazkh',
    credential: 'webrtc@live.com'
};
iceServers.push(turnServerOne);
iceServers.push(turnServerTwo);
iceServers.push(turnServerThree);
connection = new RTCPeerConnection();
connection.onconnectionstatechange = function (e) {
    // console.log('onconnectionstatechange', connection.iceConnectionState);
};
connection.ontrack = function (event) {
    var stream = event.streams[0];
    // console.log('ontrack' + stream);
    remoteVideo.srcObject = event.streams[0];
};
var exchangeSDP = 0;
connection.onicecandidate = function (event) {
    var candidate = event.candidate;
    if (!candidate)
        return;
    // const object = {};
    // object['from'] = me;
    // object['sdp'] = candidate.candidate;
    // object['sdpMid'], candidate.sdpMid;
    // object['sdpMLineIndex'], candidate.sdpMLineIndex;
    // object['serverUrl'], candidate.relatedAddress;
    console.log('onicecandidate candidate.candidate' + exchangeSDP, candidate.candidate);
    console.log('onicecandidate candidate.sdpMid' + exchangeSDP, candidate.sdpMid);
    console.log('onicecandidate candidate.sdpMLineIndex ' + exchangeSDP, candidate.sdpMLineIndex);
    console.log('onicecandidate ' + exchangeSDP, candidate);
    // console.log('onicecandidate candidate', candidate)
    //console.log('setOnIceCandidateListener ' + candidate);
    socket.emit('iceCandidate', JSON.stringify(candidate));
    //socket.emit('iceCandidate', object);
};
window.onload = function (event) {
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    init();
};
function checkSDP(payload, label) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (payload.description) {
                console.log(label, payload.description.type);
            }
            return [2 /*return*/];
        });
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var hangUp, call, answer, switchCamera;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket.on('call:incoming', function (args) {
                        console.log('call:incoming', args);
                        var object = args;
                        var payload = typeof (args.payload) == 'string' ? JSON.parse(args.payload) : args.payload;
                        console.log('call:incoming - payload', payload);
                        checkSDP(payload, 'call:incoming - sdp');
                        // const from = object['from'];
                        var session = payload['sdp'];
                        // const to = object['to'];
                        //if (to.indexOf(me) > -1) {
                        if (localStream != null) {
                            for (var _i = 0, _a = localStream.getVideoTracks(); _i < _a.length; _i++) {
                                var track = _a[_i];
                                connection.addTrack(track, localStream);
                            }
                            for (var _b = 0, _c = localStream.getAudioTracks(); _b < _c.length; _b++) {
                                var track = _c[_b];
                                connection.addTrack(track, localStream);
                            }
                        }
                        var sdp = new RTCSessionDescription({ sdp: session, type: 'offer' });
                        createAnswerForOfferReceived(sdp, payload);
                        //}
                    });
                    // socket.on('call:answer', args => {
                    //   const object = args;
                    //   const from = object['from'];
                    //   const session = object['sdp'];
                    //   const to = object['to'];
                    //   console.log('call:answer');
                    //   //console.log('me : ' + me + ' from: ' + from + ' to: ' + to);
                    //  // if (to.indexOf(me) > -1) {
                    //     console.log(me);
                    //     const sdp = new RTCSessionDescription({ type: 'offer', sdp: session });
                    //     createAnswerForOfferReceived(sdp);
                    //   //}
                    // });
                    socket.on('call:answered', function (args) {
                        console.log('call:answered', args);
                        var object = args;
                        var payload = JSON.parse(args.payload);
                        console.log('call:answered - payload', payload);
                        checkSDP(payload, 'call:answered - sdp');
                        // const from = object['from'];
                        var session = payload['sdp'];
                        // const to = object['to'];
                        //if (to.indexOf(me) > -1) {
                        // console.log('call:answered');
                        var sdp = new RTCSessionDescription({ type: 'answer', sdp: session });
                        handleAnswerReceived(sdp);
                        // dataChannelCreate("osei");
                        // dataChannelSend("osei", "Test", FancyWebRTC.DataChannelMessageType.TEXT);
                        //}
                    });
                    socket.on('call:iceCandidate', function (args) {
                        console.log('call:iceCandidate', args);
                        var object = args;
                        var payload = JSON.parse(args.payload);
                        console.log('call:iceCandidate - payload', payload);
                        checkSDP(payload, 'call:iceCandidate - sdp');
                        // console.log('call:iceCandidate', object);
                        // const from = object['from'];
                        // const session = object['sdp'];
                        // const to = object['to'];
                        // const sdpMid = object['sdpMid'];
                        // const sdpMLineIndex = object['sdpMLineIndex'];
                        // const serverUrl = object['serverUrl'];
                        // if (to.indexOf(this.me) > -1) {
                        // const candidate = new RTCIceCandidate({
                        //   candidate: session,
                        //   sdpMid,
                        //   sdpMLineIndex
                        // });
                        // console.log('call:iceCandidate candidate', candidate)
                        // console.log('call:iceCandidate object', object)
                        // if(object !== null){
                        //   // connection.addIceCandidate(object);
                        // }
                        // connection.addIceCandidate(candidate);
                        //   return
                        // }
                        connection.addIceCandidate(payload);
                        exchangeSDP += 1;
                    });
                    socket.on('connect', function (args) {
                        var object = {};
                        object['id'] = me;
                        socket.emit('init', object);
                    });
                    socket.connect();
                    return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                            audio: true,
                            video: true
                        })];
                case 1:
                    localStream = _a.sent();
                    localVideo.srcObject = localStream;
                    hangUp = document.getElementById('hangUp');
                    call = document.getElementById('call');
                    answer = document.getElementById('answer');
                    switchCamera = document.getElementById('switch');
                    hangUp.addEventListener('click', function (event) {
                        endCall(event);
                    });
                    call.addEventListener('click', function (event) {
                        makeCall(event);
                    });
                    answer.addEventListener('click', function (event) { });
                    switchCamera.addEventListener('click', function (event) { });
                    return [2 /*return*/];
            }
        });
    });
}
var localTracksAdded = false;
function makeCall(event) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, track, _b, _c, track, description;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!(connection != null)) return [3 /*break*/, 2];
                    isInitiator = true;
                    if (localStream != null) {
                        for (_i = 0, _a = localStream.getVideoTracks(); _i < _a.length; _i++) {
                            track = _a[_i];
                            connection.addTrack(track, localStream);
                        }
                        for (_b = 0, _c = localStream.getAudioTracks(); _b < _c.length; _b++) {
                            track = _c[_b];
                            connection.addTrack(track, localStream);
                        }
                    }
                    return [4 /*yield*/, connection.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        })];
                case 1:
                    description = _d.sent();
                    setInitiatorLocalSdp(description);
                    _d.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function setInitiatorLocalSdp(sdp) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection == null)
                        return [2 /*return*/];
                    if (connection.localDescription != null &&
                        (connection.localDescription.type === 'answer' && sdp.type === 'answer'))
                        return [2 /*return*/];
                    // console.log('setInitiatorLocalSdp');
                    return [4 /*yield*/, connection.setLocalDescription(sdp)];
                case 1:
                    // console.log('setInitiatorLocalSdp');
                    _a.sent();
                    // console.log(' setInitiatorLocalSdp : success');
                    sendInitiatorSdp(sdp);
                    return [2 /*return*/];
            }
        });
    });
}
function sendInitiatorSdp(sdp) {
    return __awaiter(this, void 0, void 0, function () {
        var object;
        return __generator(this, function (_a) {
            object = {};
            object['from'] = me;
            object['sdp'] = sdp.sdp;
            object['description'] = connection.localDescription;
            socket.emit('call', object);
            return [2 /*return*/];
        });
    });
}
function createAnswerForOfferReceived(remoteSdp) {
    return __awaiter(this, void 0, void 0, function () {
        var description;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('createAnswerForOfferReceived', remoteSdp);
                    if (connection == null || remoteSdp == null)
                        return [2 /*return*/];
                    /* if (connection.getRemoteDescription() != null && (connection.getRemoteDescription().getType() == FancyRTCSdpType.ANSWER && remoteSdp.getType() == FancyRTCSdpType.ANSWER))
                          return;
                      */
                    return [4 /*yield*/, connection.setRemoteDescription(remoteSdp)];
                case 1:
                    /* if (connection.getRemoteDescription() != null && (connection.getRemoteDescription().getType() == FancyRTCSdpType.ANSWER && remoteSdp.getType() == FancyRTCSdpType.ANSWER))
                          return;
                      */
                    _a.sent();
                    // console.log('createAnswerForOfferReceived: success', remoteSdp);
                    handleRemoteDescriptionSet();
                    return [4 /*yield*/, connection.createAnswer({
                            offerToReceiveVideo: true,
                            offerToReceiveAudio: true
                        })];
                case 2:
                    description = _a.sent();
                    // console.log('createAnswer: success');
                    setNonInitiatorLocalSdp(description);
                    return [2 /*return*/];
            }
        });
    });
}
function setNonInitiatorLocalSdp(sdp) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection == null)
                        return [2 /*return*/];
                    if (connection.localDescription != null &&
                        (connection.localDescription.type === 'answer' && sdp.type === 'answer'))
                        return [2 /*return*/];
                    // console.log(' setNonInitiatorLocalSdp ', sdp);
                    return [4 /*yield*/, connection.setLocalDescription(sdp)];
                case 1:
                    // console.log(' setNonInitiatorLocalSdp ', sdp);
                    _a.sent();
                    // console.log(' setNonInitiatorLocalSdp : success');
                    sendNonInitiatorSdp(sdp);
                    return [2 /*return*/];
            }
        });
    });
}
function sendNonInitiatorSdp(sdp) {
    return __awaiter(this, void 0, void 0, function () {
        var object;
        return __generator(this, function (_a) {
            object = {};
            object['from'] = me;
            object['sdp'] = sdp.sdp; // ???
            object['description'] = connection.localDescription;
            /* handleAnswerReceived(sdp); */
            socket.emit('answered', JSON.stringify(object));
            return [2 /*return*/];
        });
    });
}
function handleRemoteDescriptionSet() {
    for (var _i = 0, remoteIceCandidates_1 = remoteIceCandidates; _i < remoteIceCandidates_1.length; _i++) {
        var iceCandidate = remoteIceCandidates_1[_i];
        connection.addIceCandidate(iceCandidate);
    }
    remoteIceCandidates = [];
}
function endCall(event) {
    connection.close();
}
function handleAnswerReceived(sdp) {
    return __awaiter(this, void 0, void 0, function () {
        var newSdp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (connection == null || sdp == null || inCall)
                        return [2 /*return*/];
                    newSdp = new RTCSessionDescription({ type: 'answer', sdp: sdp.sdp });
                    return [4 /*yield*/, connection.setRemoteDescription(newSdp)];
                case 1:
                    _a.sent();
                    // console.log('handleAnswerReceived: SUCCESS');
                    inCall = true;
                    return [2 /*return*/];
            }
        });
    });
}
function errorHandler(error) {
    console.log(error);
}
