import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export function OnboardingScreen() {
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'token' | 'pin' | 'confirm'>('token');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const { setMotorista } = useAuthStore();

  useEffect(() => {
    // Handle deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        const { queryParams } = Linking.parse(url);
        if (queryParams?.token) {
          setToken(queryParams.token as string);
        }
      }
    });
  }, []);

  async function validateToken() {
    if (!token.trim()) return Alert.alert('Erro', 'Digite o codigo do convite');
    setLoading(true);
    try {
      const res = await api.get<{ nome: string }>(`/convite/${token}`);
      setNome(res.nome);
      setStep('pin');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Convite invalido');
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    if (pin.length !== 4) return Alert.alert('Erro', 'PIN deve ter 4 digitos');
    if (pin !== confirmPin) return Alert.alert('Erro', 'PINs nao conferem');

    setLoading(true);
    try {
      const res = await api.post<any>(`/convite/${token}/completar`, { pin });
      setMotorista(res.motorista);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao completar cadastro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>RotaVans</Text>
        <Text style={styles.subtitle}>Motorista</Text>
      </View>

      {step === 'token' && (
        <View style={styles.form}>
          <Text style={styles.label}>Codigo do Convite</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Digite o codigo recebido"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={validateToken} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Validando...' : 'Continuar'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'pin' && (
        <View style={styles.form}>
          <Text style={styles.welcome}>Ola, {nome}!</Text>
          <Text style={styles.label}>Crie um PIN de 4 digitos</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="PIN"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
          <Text style={styles.label}>Confirme o PIN</Text>
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirme o PIN"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={finishOnboarding} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Finalizando...' : 'Finalizar Cadastro'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  form: { flex: 1 },
  welcome: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 24 },
  label: { fontSize: 14, color: '#888', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  button: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
