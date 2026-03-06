import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { getActiveProfile, useAuthStore } from '../stores/auth';

export function PinSetupScreen() {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPinConfigured } = useAuthStore();
  const active = getActiveProfile();

  async function handleSave() {
    if (!active) return;
    if (!/^\d{4,6}$/.test(pin)) {
      Alert.alert('Erro', 'O PIN deve ter entre 4 e 6 dígitos numéricos.');
      return;
    }
    if (pin !== confirm) {
      Alert.alert('Erro', 'Os PINs não conferem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/motorista/definir-pin', { pin });
      await setPinConfigured(active.motorista.id, true);
      Alert.alert('Sucesso', 'PIN cadastrado com sucesso.');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao salvar PIN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Definir PIN do Motorista</Text>
      <Text style={styles.subtitle}>
        Este tablet ficará fixo no veículo. Defina um PIN de 4 a 6 dígitos para login rápido.
      </Text>

      <Text style={styles.label}>PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
      />

      <Text style={styles.label}>Confirmar PIN</Text>
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Salvar PIN'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 48 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#8b8f98', fontSize: 14, marginTop: 8, marginBottom: 20 },
  label: { color: '#a9afba', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#15181c',
    borderWidth: 1,
    borderColor: '#262a2f',
    borderRadius: 12,
    color: '#fff',
    padding: 14,
    fontSize: 18,
    letterSpacing: 3,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
