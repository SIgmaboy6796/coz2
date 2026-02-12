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
    private peer: any = null;
    private signalServer = 'wss://signal.example.com'; // Placeholder - user can override
    private isHost = false;
    private peers: Map<string, any> = new Map();
    private onPlayerJoined: ((player: PlayerState) => void) | null = null;
    private onPlayerLeft: ((playerId: string) => void) | null = null;
    private onStateUpdate: ((gameState: GameState) => void) | null = null;

    constructor(signalServerUrl?: string) {
        this.peerId = this.generatePeerId();
        if (signalServerUrl) {
            this.signalServer = signalServerUrl;
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
        
        // In a real implementation, this would contact a signaling server
        // For now, return a shareable URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&host=${this.peerId}`;
        
        console.log('Hosting game with room ID:', roomId);
        
        return shareUrl;
    }

    public async joinGame(roomId: string): Promise<boolean> {
        this.isHost = false;
        
        try {
            // In a real implementation, connect to signaling server and other peers
            console.log('Joining game room:', roomId);
            return true;
        } catch (error) {
            console.error('Failed to join game:', error);
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
                        // Silently fail on closed connections
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
                        // Silently fail on closed connections
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

    public setOnStateUpdate(callback: (gameState: GameState) => void) {
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
        
        // Notify all connected peers that hosting has stopped
        this.peers.forEach((peer) => {
            if (peer && peer.send) {
                try {
                    peer.send(JSON.stringify({
                        type: 'hostStopped',
                        message: 'User stopped hosting'
                    }));
                } catch (e) {
                    // Ignore errors
                }
            }
        });
        
        // Disconnect all peers
        this.disconnect();
        
        console.log('Stopped hosting game');
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
