import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'tablet_device_id';

function randomId() {
  return `tablet-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export async function getDeviceId() {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) return stored;

  const androidId = await Application.getAndroidId();
  const source = androidId || Application.applicationId || randomId();
  const normalized = `rv-${source}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  await SecureStore.setItemAsync(DEVICE_ID_KEY, normalized);
  return normalized;
}
