import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Image, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useLogin } from '../hooks/useLogin';
import { styles } from './styles/Login.styles';

export default function Login() {
  const {
    correo,
    setCorreo,
    contrasena,
    setContrasena,
    handleLogin,
  } = useLogin();
  const contrasenaInputRef = useRef(null);

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <Animatable.View
        animation="fadeInUp"
        delay={200}
        duration={800}
        style={styles.card}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#888"
          onChangeText={setCorreo}
          value={correo}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => contrasenaInputRef.current.focus()}
          blurOnSubmit={false}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••"
          placeholderTextColor="#888"
          onChangeText={setContrasena}
          value={contrasena}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          ref={contrasenaInputRef}
        />
        <TouchableOpacity onPress={handleLogin} style={{ width: '100%' }}>
          <LinearGradient
            colors={['#3bb78f', '#0bab64']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </LinearGradient>
  );
}
