export interface PlayerState {
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    username: string;
}

export interface ObjectState {
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    velocity: { x: number; y: number; z: number };
}

export interface GameState {
    players: PlayerState[];
    objects: ObjectState[];
}

export class Multiplayer {
    private peerId: string = '';
    private isHost = false;
    private peers: Map<string, any> = new Map();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onPlayerJoined: ((player: PlayerState) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onPlayerLeft: ((playerId: string) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onStateUpdate: ((position: { x: number; y: number; z: number }, playerId: string) => void) | null = null;

    constructor(_signalServerUrl?: string) {
        this.peerId = this.generatePeerId();
        // TODO: Implement WebRTC signaling server support
        // if (_signalServerUrl) { ... }
    }

    // --- WebRTC helper methods (manual signaling) ---
    private createPeerConnection(): RTCPeerConnection {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (ev) => {
            // Candidate generation will be visible in offer/answer SDP (manual signaling required)
            console.log('[Multiplayer][RTCPeer] ICE candidate', ev.candidate);
        };

        pc.ondatachannel = (ev) => {
            const dc = ev.channel;
            this.attachDataChannel(dc);
        };

        return pc;
    }

    private attachDataChannel(dc: RTCDataChannel) {
        dc.onopen = () => console.log('[Multiplayer][DataChannel] open');
        dc.onclose = () => console.log('[Multiplayer][DataChannel] close');
        dc.onerror = (e) => console.warn('[Multiplayer][DataChannel] error', e);
        dc.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.type === 'playerState') {
                    const data = msg.data as PlayerState;
                    this.onStateUpdate && this.onStateUpdate(data.position, data.id);
                } else if (msg.type === 'playerJoined') {
                    this.onPlayerJoined && this.onPlayerJoined(msg.data as PlayerState);
                } else if (msg.type === 'playerLeft') {
                    this.onPlayerLeft && this.onPlayerLeft(msg.data as string);
                }
            } catch (e) {
                console.warn('[Multiplayer] Failed to parse data channel message', e);
            }
        };
    }

    // Create an offer SDP (host) — caller is responsible for sharing the SDP to peers via out-of-band signaling
    public async createOfferSDP(): Promise<string> {
        const pc = this.createPeerConnection();
        const dc = pc.createDataChannel('game');
        this.attachDataChannel(dc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // store peer in map under local peer id
        this.peers.set('remote', { pc, dc });
        return JSON.stringify(pc.localDescription);
    }

    // Accept an offer SDP and return an answer SDP (client side)
    public async acceptOfferAndCreateAnswer(offerSDP: string): Promise<string | null> {
        try {
            const pc = this.createPeerConnection();
            const offer = JSON.parse(offerSDP) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(offer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // store peer
            this.peers.set('remote', { pc, dc: null });
            return JSON.stringify(pc.localDescription);
        } catch (e) {
            console.error('[Multiplayer] Failed to accept offer:', e);
            return null;
        }
    }

    // Apply an answer SDP from remote to complete handshake (host side)
    public async applyAnswerSDP(answerSDP: string) {
        try {
            const entry = this.peers.get('remote');
            if (!entry) throw new Error('No peer to apply answer to');
            const pc: RTCPeerConnection = entry.pc;
            const answer = JSON.parse(answerSDP) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(answer);
            console.log('[Multiplayer] Applied remote answer');
        } catch (e) {
            console.error('[Multiplayer] Failed to apply answer SDP:', e);
        }
    }

    // Send JSON message to remote peer (if connected)
    private sendToRemote(msg: any) {
        const entry = this.peers.get('remote');
        if (!entry) return;
        const dc: RTCDataChannel = entry.dc;
        if (dc && dc.readyState === 'open') {
            try {
                dc.send(JSON.stringify(msg));
            } catch (e) {
                console.warn('[Multiplayer] send failed', e);
            }
        }
    }

    private generatePeerId(): string {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    public getPlayerId(): string {
        return this.peerId;
    }

    public async hostGame(): Promise<string> {
        this.isHost = true;
        
        // Generate a unique room ID
        const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
        
        // Return a shareable URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&host=${this.peerId}`;
        
        console.log('[Multiplayer] Hosting game with room ID:', roomId);
        console.log('[Multiplayer] Share URL:', shareUrl);
        
        return shareUrl;
    }

    public async joinGame(roomId: string): Promise<boolean> {
        this.isHost = false;
        
        try {
            if (!roomId || roomId.length === 0) {
                console.warn('[Multiplayer] Invalid room ID - empty string');
                return false;
            }
            
            console.log('[Multiplayer] Joining game room:', roomId);
            // TODO: Connect to signaling server and other peers
            return true;
        } catch (error) {
            console.error('[Multiplayer] Failed to join game:', error);
            return false;
        }
    }

    public sendPlayerState(state: PlayerState) {
        if (this.isHost) {
            // Broadcast to all connected peers
            this.peers.forEach((peer) => {
                if (peer && peer.send) {
                    try {
                        peer.send(JSON.stringify({
                            type: 'playerState',
                            data: state
                        }));
                    } catch (e) {
                        console.warn('[Multiplayer] Failed to send player state:', e);
                    }
                }
            });
        }
    }

    public sendObjectState(state: ObjectState) {
        if (this.isHost) {
            this.peers.forEach((peer) => {
                if (peer && peer.send) {
                    try {
                        peer.send(JSON.stringify({
                            type: 'objectState',
                            data: state
                        }));
                    } catch (e) {
                        console.warn('[Multiplayer] Failed to send object state:', e);
                    }
                }
            });
        }
    }

    public setOnPlayerJoined(callback: (player: PlayerState) => void) {
        this.onPlayerJoined = callback;
    }

    public setOnPlayerLeft(callback: (playerId: string) => void) {
        this.onPlayerLeft = callback;
    }

    public setOnStateUpdate(callback: (position: { x: number; y: number; z: number }, playerId: string) => void) {
        this.onStateUpdate = callback;
    }

    public isMultiplayer(): boolean {
        return this.peers.size > 0;
    }

    public getPeerCount(): number {
        return this.peers.size;
    }

    public stopHosting() {
        this.isHost = false;
        
        console.log('[Multiplayer] Stopping hosting, notifying', this.peers.size, 'peer(s)');
        
        // Notify all connected peers that hosting has stopped
        this.peers.forEach((peer) => {
            if (peer && peer.send) {
                try {
                    peer.send(JSON.stringify({
                        type: 'hostStopped',
                        message: 'User stopped hosting'
                    }));
                    console.log('[Multiplayer] Notified peer of host stop');
                } catch (e) {
                    console.warn('[Multiplayer] Failed to notify peer:', e);
                }
            }
        });
        
        // Disconnect all peers
        this.disconnect();
        
        console.log('[Multiplayer] Stopped hosting game');
    }

    public getHostingStatus(): boolean {
        return this.isHost;
    }

    public disconnect() {
        this.peers.forEach((peer) => {
            try {
                peer.close?.();
            } catch (e) {
                // Ignore errors
            }
        });
        this.peers.clear();
    }
}
