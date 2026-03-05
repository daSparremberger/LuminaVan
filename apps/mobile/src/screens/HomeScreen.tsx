import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import type { Rota } from '@rotavans/shared';

export function HomeScreen() {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { motorista, logout } = useAuthStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadRotas();
  }, []);

  async function loadRotas() {
    try {
      const data = await api.get<Rota[]>('/motorista/rotas');
      setRotas(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadRotas();
    setRefreshing(false);
  }

  function startRota(rota: Rota) {
    navigation.navigate('Rota', { rota });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ola,</Text>
          <Text style={styles.name}>{motorista?.nome}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Suas Rotas</Text>

      {rotas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma rota atribuida</Text>
        </View>
      ) : (
        <FlatList
          data={rotas}
          keyExtractor={(r) => r.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rotaCard} onPress={() => startRota(item)}>
              <View>
                <Text style={styles.rotaNome}>{item.nome}</Text>
                <Text style={styles.rotaInfo}>{item.turno} - {(item as any).paradas_count || 0} paradas</Text>
              </View>
              <View style={styles.startBtn}>
                <Text style={styles.startText}>Iniciar</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 32 },
  greeting: { fontSize: 16, color: '#888' },
  name: { fontSize: 24, fontWeight: '700', color: '#fff' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#666', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  rotaCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rotaNome: { fontSize: 18, fontWeight: '600', color: '#fff' },
  rotaInfo: { fontSize: 14, color: '#888', marginTop: 4 },
  startBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  startText: { color: '#fff', fontWeight: '600' },
});
