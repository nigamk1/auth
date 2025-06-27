import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../AuthContext';
import type { NiftyData, OptionData, TradeSignal } from '../../types';

interface TradingSocketContextType {
  connected: boolean;
  niftyData: NiftyData | null;
  optionsData: Record<string, OptionData>;
  lastSignal: TradeSignal | null;
  recentSignals: TradeSignal[];
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const TradingSocketContext = createContext<TradingSocketContextType>({
  connected: false,
  niftyData: null,
  optionsData: {},
  lastSignal: null,
  recentSignals: [],
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const useTradingSocket = () => useContext(TradingSocketContext);

interface TradingSocketProviderProps {
  children: ReactNode;
}

export const TradingSocketProvider: React.FC<TradingSocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('accessToken');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [niftyData, setNiftyData] = useState<NiftyData | null>(null);
  const [optionsData, setOptionsData] = useState<Record<string, OptionData>>({});
  const [lastSignal, setLastSignal] = useState<TradeSignal | null>(null);
  const [recentSignals, setRecentSignals] = useState<TradeSignal[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Join default rooms
      newSocket.emit('join', ['nifty', 'signals']);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('nifty_update', (data: NiftyData) => {
      setNiftyData(data);
    });

    newSocket.on('option_update', (data: OptionData) => {
      setOptionsData(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    newSocket.on('trade_signal', (data: TradeSignal) => {
      setLastSignal(data);
      setRecentSignals(prev => {
        // Add to start of array and limit to 20 signals
        const updated = [data, ...prev.filter(signal => signal.id !== data.id)];
        return updated.slice(0, 20);
      });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Function to join a room
  const joinRoom = (room: string) => {
    if (socket && connected) {
      socket.emit('join', [room]);
    }
  };

  // Function to leave a room
  const leaveRoom = (room: string) => {
    if (socket && connected) {
      socket.emit('leave', [room]);
    }
  };

  return (
    <TradingSocketContext.Provider value={{
      connected,
      niftyData,
      optionsData,
      lastSignal,
      recentSignals,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </TradingSocketContext.Provider>
  );
};
