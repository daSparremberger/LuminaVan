import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useAuthStore } from '../stores/auth';
import { firebaseAuth, missingFirebaseConfig } from '../lib/firebase';
import { getDeviceId } from '../lib/device';
import { api } from '../lib/api';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

type LoginResponse = {
  role: 'admin' | 'gestor' | 'motorista';
  has_pin?: boolean;
  app_token?: string;
  user: {
    id: number;
    tenant_id: number;
    firebase_uid?: string;
    nome: string;
  };
};

function parseInviteToken(url: string | null) {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    if (parsed.queryParams?.token) return String(parsed.queryParams.token);
    const path = parsed.path || '';
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'convite' && parts[1]) return parts[1];
    return null;
  } catch {
    return null;
  }
}

export function OnboardingScreen() {
  const {
    profiles,
    setActiveProfile,
    upsertProfile,
    setVehicleBound,
  } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  const profileList = useMemo(() => profiles.map((item) => item.motorista), [profiles]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => setInviteToken(parseInviteToken(url)));
    const subscription = Linking.addEventListener('url', ({ url }) => {
      setInviteToken(parseInviteToken(url));
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!response || response.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) {
      Alert.alert('Erro', 'Não foi possível concluir o login com Google.');
      return;
    }
    concluirLoginGoogle(idToken).catch((err) => {
      Alert.alert('Erro', err.message || 'Falha no login');
    });
  }, [response]);

  async function concluirLoginGoogle(idToken: string) {
    if (!firebaseAuth) {
      throw new Error(
        `Configurações do Firebase ausentes no aplicativo: ${missingFirebaseConfig.join(', ')}.`
      );
    }
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(firebaseAuth, credential);

      const endpoint = inviteToken
        ? `${API_URL}/auth/convite/${inviteToken}/aceitar`
        : `${API_URL}/auth/login`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Falha no login' }));
        throw new Error(data.error || 'Falha no login');
      }

      const data = (await res.json()) as LoginResponse;
      if (data.role !== 'motorista' || !data.app_token) {
        throw new Error('Esta conta não é de motorista.');
      }

      await upsertProfile({
        motorista: {
          id: data.user.id,
          tenant_id: data.user.tenant_id,
          firebase_uid: data.user.firebase_uid,
          nome: data.user.nome,
          ativo: true,
          cadastro_completo: true,
          criado_em: new Date().toISOString(),
        } as any,
        token: data.app_token,
        pinConfigured: Boolean(data.has_pin),
        vehicleBound: false,
      });

      const deviceId = await getDeviceId();
      const vinculo = await api.get<{ id: number; veiculo_id: number; placa: string } | null>(
        `/motorista/tablet-vinculo?device_id=${encodeURIComponent(deviceId)}`
      );
      await setVehicleBound(data.user.id, Boolean(vinculo));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>RotaVans</Text>
        <Text style={styles.subtitle}>Selecione um motorista</Text>
      </View>

      <FlatList
        data={profileList}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum motorista sincronizado neste tablet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setActiveProfile(item.id)}>
            <View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardSub}>Toque para entrar com PIN</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
      />

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.disabled]}
        onPress={() => {
          if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
            Alert.alert(
              'Configuração pendente',
              'Defina EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID para habilitar o login Google.'
            );
            return;
          }
          promptAsync();
        }}
        disabled={loading}
      >
        <Text style={styles.plus}>+</Text>
        <Text style={styles.googleButtonText}>{loading ? 'Sincronizando...' : 'Entrar com Google'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 48 },
  header: { marginBottom: 20 },
  logo: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#8b8f98', fontSize: 15, marginTop: 6 },
  empty: { color: '#8b8f98', textAlign: 'center', marginTop: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#262a2f',
    backgroundColor: '#15181c',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 17 },
  cardSub: { color: '#8b8f98', marginTop: 4, fontSize: 13 },
  googleButton: {
    marginTop: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  googleButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  plus: { color: '#fff', fontWeight: '700', fontSize: 20, lineHeight: 20 },
  disabled: { opacity: 0.7 },
});
