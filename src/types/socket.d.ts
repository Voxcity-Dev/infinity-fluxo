import type { User } from './user.type';

declare module 'socket.io' {
  interface Socket {
    user: User;
  }
}
