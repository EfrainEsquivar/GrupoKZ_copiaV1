import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase/client';

export const useLogin = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    const userId = data.user.id;

    const { data: perfil, error: errorPerfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_uid', userId)
      .single();

    if (errorPerfil || !perfil) {
      Alert.alert('Error', 'No se encontró el perfil del usuario.');
      return;
    }

    if (perfil.rol?.toLowerCase().trim() === 'administrador') {
      router.replace(`/pages/DashboardAdmin?correo=${correo}`);
    } else {
      router.replace(`/pages/DashboardUsuario?correo=${correo}`);
    }
  };

  return { correo, setCorreo, contrasena, setContrasena, handleLogin };
};
