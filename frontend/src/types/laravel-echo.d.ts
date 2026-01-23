declare module 'laravel-echo' {
  export interface EchoOptions {
    broadcaster: 'reverb' | 'pusher' | 'socket.io' | 'null';
    key: string;
    wsHost?: string;
    wsPort?: number;
    wssPort?: number;
    forceTLS?: boolean;
    enabledTransports?: string[];
    authEndpoint?: string;
    auth?: {
      headers?: Record<string, string>;
    };
    cluster?: string;
    encrypted?: boolean;
    namespace?: string;
  }

  export interface Channel {
    listen(event: string, callback: (data: unknown) => void): this;
    notification(callback: (notification: unknown) => void): this;
    stopListening(event: string): this;
  }

  export interface PrivateChannel extends Channel {
    whisper(eventName: string, data: unknown): this;
  }

  export interface PresenceChannel extends PrivateChannel {
    here(callback: (users: unknown[]) => void): this;
    joining(callback: (user: unknown) => void): this;
    leaving(callback: (user: unknown) => void): this;
  }

  export default class Echo<T extends string = 'reverb'> {
    constructor(options: EchoOptions);
    channel(channel: string): Channel;
    private(channel: string): PrivateChannel;
    join(channel: string): PresenceChannel;
    leave(channel: string): void;
    disconnect(): void;
    connector: {
      socket: WebSocket;
    };
  }
}
