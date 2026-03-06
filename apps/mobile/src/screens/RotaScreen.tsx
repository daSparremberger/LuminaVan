import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, connectSocket, getSocket, disconnectSocket } from '../lib/api';
import type { Rota, RotaParada } from '@rotavans/shared';

const { width, height } = Dimensions.get('window');

export function RotaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { rota } = route.params as { rota: Rota };

  const [paradas, setParadas] = useState<RotaParada[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const execucaoIdRef = useRef<number | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadParadas();
    startExecucao();
    startLocationTracking();
    initSocket();

    return () => {
      locationWatcherRef.current?.remove();
      disconnectSocket();
    };
  }, []);

  async function initSocket() {
    await connectSocket();
  }

  async function loadParadas() {
    try {
      const detail = await api.get<Rota>(`/motorista/rotas/${rota.id}`);
      setParadas(detail.paradas || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function startExecucao() {
    try {
      const res = await api.post<{ id: number }>(`/execucao/iniciar`, { rota_id: rota.id });
      setExecucaoId(res.id);
      execucaoIdRef.current = res.id;
    } catch (err) {
      console.error(err);
    }
  }

  async function startLocationTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Localização necessária',
        'Permita o acesso à localização para habilitar o rastreamento em tempo real.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const bgPermission = await Location.requestBackgroundPermissionsAsync();
    if (bgPermission.status !== 'granted') {
      Alert.alert(
        'Permissão em segundo plano',
        'Sem permissão em segundo plano, o rastreamento funciona apenas com o app aberto.'
      );
    }

    locationWatcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
      (loc) => {
        setLocation(loc);
        const currentExecucaoId = execucaoIdRef.current;
        const socket = getSocket();
        if (socket?.connected && currentExecucaoId) {
          socket.emit('location_update', {
            rota_id: rota.id,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            speed: (loc.coords.speed || 0) * 3.6, // m/s to km/h
            heading: loc.coords.heading || 0,
          });
        }
      }
    );
  }

  async function marcarParada(status: 'embarcou' | 'pulado') {
    if (!execucaoId) return;
    const parada = paradas[currentIndex];

    try {
      await api.post(`/execucao/${execucaoId}/parada`, {
        aluno_id: parada.aluno_id,
        status,
        lat: location?.coords.latitude,
        lng: location?.coords.longitude,
      });

      if (currentIndex < paradas.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Center map on next stop
        const next = paradas[currentIndex + 1];
        if (next.lat && next.lng) {
          mapRef.current?.animateToRegion({
            latitude: next.lat,
            longitude: next.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } else {
        // Finish route
        await api.post(`/execucao/${execucaoId}/finalizar`, {});
        Alert.alert('Rota Finalizada', 'Todos os alunos foram processados!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  }

  const currentParada = paradas[currentIndex];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentParada?.lat || -15.78,
          longitude: currentParada?.lng || -47.93,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Voce"
            pinColor="#22C55E"
          />
        )}
        {paradas.map((p, i) => (
          p.lat && p.lng && (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              title={p.aluno_nome || `Parada ${i + 1}`}
              pinColor={i < currentIndex ? '#888' : i === currentIndex ? '#3B82F6' : '#EF4444'}
            />
          )
        ))}
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.progress}>
          <Text style={styles.progressText}>{currentIndex + 1} / {paradas.length}</Text>
        </View>

        {currentParada && (
          <>
            <Text style={styles.alunoNome}>{currentParada.aluno_nome}</Text>
            <Text style={styles.alunoEndereco}>{currentParada.aluno_endereco}</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={() => marcarParada('pulado')}>
                <Text style={styles.actionText}>Pular</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => marcarParada('embarcou')}>
                <Text style={styles.actionText}>Embarcou</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancelar Rota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height: height * 0.55 },
  bottomSheet: { flex: 1, backgroundColor: '#0a0a0a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: -24 },
  progress: { alignItems: 'center', marginBottom: 16 },
  progressText: { color: '#888', fontSize: 14 },
  alunoNome: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' },
  alunoEndereco: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  skipBtn: { backgroundColor: '#EF4444' },
  confirmBtn: { backgroundColor: '#22C55E' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 14 },
});
