import {SocketIO} from 'nativescript-socketio';
export default {
    socket: new SocketIO('http://192.168.1.5:3001', {
        forceNew: true,
        secure: false
    }),
    getInstance(){
        return this.socket;
    }
}
