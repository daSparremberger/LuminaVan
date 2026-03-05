import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export function PinScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { motorista, verifyPin, logout } = useAuthStore();

  async function checkPin() {
    if (pin.length !== 4) return Alert.alert('Erro', 'PIN deve ter 4 digitos');
    setLoading(true);
    try {
      await api.post('/motorista/verificar-pin', { pin });
      verifyPin();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'PIN incorreto');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>RotaVans</Text>
        <Text style={styles.welcome}>Ola, {motorista?.nome}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Digite seu PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="****"
          placeholderTextColor="#666"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={checkPin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Verificando...' : 'Entrar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sair desta conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: '700', color: '#fff' },
  welcome: { fontSize: 18, color: '#888', marginTop: 8 },
  form: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 14, color: '#888', marginBottom: 8, textAlign: 'center' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  button: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { marginTop: 24, alignItems: 'center' },
  logoutText: { color: '#666', fontSize: 14 },
});
