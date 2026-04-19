import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { socketRef.current?.disconnect(); return; }

    const token = localStorage.getItem('token');
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('notification', (data) => {
      setUnreadCount((c) => c + 1);
      toast(data.message, { icon: '🔔', duration: 4000 });
    });

    socketRef.current.on('task_update', (data) => {
      // Dispatch a custom event so any page can react
      window.dispatchEvent(new CustomEvent('task_update', { detail: data }));
    });

    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const joinTeam = (teamId) => socketRef.current?.emit('join_team', teamId);
  const leaveTeam = (teamId) => socketRef.current?.emit('leave_team', teamId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, unreadCount, setUnreadCount, joinTeam, leaveTeam }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
