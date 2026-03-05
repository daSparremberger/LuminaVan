import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro');
  }
  return res.json();
}

export async function connectSocket(): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(BASE, { auth: { token } });

  socket.on('connect', () => console.log('[Socket] Conectado'));
  socket.on('disconnect', () => console.log('[Socket] Desconectado'));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const api = {
  get: <T>(path: string) => req<T>(path),
  post: <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => req<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
};
