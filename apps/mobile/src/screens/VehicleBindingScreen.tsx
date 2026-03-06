import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/device';
import { getActiveProfile, useAuthStore } from '../stores/auth';

interface VehicleItem {
  id: number;
  placa: string;
  modelo: string;
  motorista_habilitado: boolean;
  status: 'livre' | 'vinculado_neste_tablet' | 'vinculado_em_outro_tablet';
}

export function VehicleBindingScreen() {
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const { setVehicleBound } = useAuthStore();
  const active = getActiveProfile();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const id = await getDeviceId();
      setDeviceId(id);
      const data = await api.get<VehicleItem[]>(`/motorista/veiculos-tablet?device_id=${encodeURIComponent(id)}`);
      setItems(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao carregar veículos');
    } finally {
      setLoading(false);
    }
  }

  async function vincular(veiculoId: number) {
    if (!active || !deviceId) return;
    setSavingId(veiculoId);
    try {
      await api.post('/motorista/vincular-tablet', {
        veiculo_id: veiculoId,
        device_id: deviceId,
        device_nome: 'Tablet Motorista',
      });
      await setVehicleBound(active.motorista.id, true);
      Alert.alert('Sucesso', 'Tablet vinculado ao veículo com sucesso.');
      await carregar();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao vincular veículo');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vincular Tablet ao Veículo</Text>
      <Text style={styles.subtitle}>
        Selecione o veículo deste tablet. Veículos já vinculados ficam desabilitados em cinza.
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={carregar}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const blocked = item.status === 'vinculado_em_outro_tablet' || !item.motorista_habilitado;
          const selected = item.status === 'vinculado_neste_tablet';
          return (
            <TouchableOpacity
              disabled={blocked || savingId !== null}
              onPress={() => vincular(item.id)}
              style={[
                styles.card,
                blocked && styles.cardBlocked,
                selected && styles.cardSelected,
              ]}
            >
              <Text style={[styles.plate, blocked && styles.textBlocked]}>{item.placa}</Text>
              <Text style={[styles.model, blocked && styles.textBlocked]}>{item.modelo}</Text>
              <Text style={[styles.status, blocked && styles.textBlocked]}>
                {item.status === 'livre' && 'Livre para vincular'}
                {item.status === 'vinculado_neste_tablet' && 'Já vinculado neste tablet'}
                {item.status === 'vinculado_em_outro_tablet' && 'Vinculado em outro tablet'}
                {!item.motorista_habilitado && ' - motorista não habilitado'}
              </Text>
              {!blocked && (
                <Text style={styles.actionText}>
                  {savingId === item.id ? 'Vinculando...' : selected ? 'Revalidar vínculo' : 'Vincular'}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 48 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#8b8f98', marginTop: 8, marginBottom: 16 },
  card: {
    backgroundColor: '#15181c',
    borderWidth: 1,
    borderColor: '#262a2f',
    borderRadius: 14,
    padding: 14,
  },
  cardBlocked: {
    opacity: 0.5,
  },
  cardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#13233f',
  },
  plate: { color: '#fff', fontSize: 17, fontWeight: '700' },
  model: { color: '#d1d6e0', marginTop: 4 },
  status: { color: '#98a0ad', marginTop: 6, fontSize: 12 },
  actionText: { color: '#3B82F6', marginTop: 10, fontWeight: '700' },
  textBlocked: { color: '#707784' },
});
