import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const socketInstance = io(window.location.origin, {
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected');
      socketInstance.emit('player:register', user.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    });

    // Global invitation listener
    socketInstance.on('invite:received', (data: { fromPlayerId: number, invitationId: string }) => {
      toast.info(`New challenge received from Player #${data.fromPlayerId}!`, {
        action: {
          label: 'View Lobby',
          onClick: () => window.location.href = '/lobby'
        }
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
