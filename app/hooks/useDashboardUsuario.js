import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isPhone: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  };
};

export const useDashboardUsuario = () => {
  const { correo } = useLocalSearchParams();
  const router = useRouter();
  const { width, height, isPhone, isTablet, isDesktop } = useResponsive();
  const [iaEscribiendo, setIaEscribiendo] = useState(false);
  const [contenidoActual, setContenidoActual] = useState('/pages/DashboardUsuario');
  const [sidebarExpanded, setSidebarExpanded] = useState(!isPhone);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (isPhone) {
      setSidebarExpanded(false);
    } else {
      setDrawerVisible(false);
    }
  }, [isPhone]);

  const toggleMenu = (menu) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSidebarToggle = () => {
    if (isPhone) {
      setDrawerVisible(!drawerVisible);
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const handleMenuItemPress = (ruta) => {
    setContenidoActual(ruta);
    if (isPhone) {
      setDrawerVisible(false);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const texto = mensaje.trim();
    setMensajes((prev) => [...prev, { texto, propio: true }]);
    setMensaje('');
    setIaEscribiendo(true);

    try {
      let chatId = await AsyncStorage.getItem('chatId');
      if (!chatId) {
        chatId = 'chat_' + Math.random().toString(36).substring(2, 10);
        await AsyncStorage.setItem('chatId', chatId);
      }

      const response = await fetch('https://n8n.varac.io/webhook/2db75189-bd6e-4538-a194-51b2cf09a77a/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: texto,
          route: 'general',
        }),
      });

      const data = await response.json();
      const respuesta = data.output || '🤖 Lo siento, no entendí eso.';
      setTimeout(() => {
        setIaEscribiendo(false);
        setMensajes((prev) => [...prev, { texto: respuesta, propio: false }]);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 1000);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setTimeout(() => {
        setIaEscribiendo(false);
        setMensajes((prev) => [
          ...prev,
          { texto: '❌ Error al conectar con el asistente.', propio: false },
        ]);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 1000);
    }
  };

  return {
    correo,
    router,
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    iaEscribiendo,
    contenidoActual,
    setContenidoActual,
    sidebarExpanded,
    setSidebarExpanded,
    drawerVisible,
    setDrawerVisible,
    chatVisible,
    setChatVisible,
    mensaje,
    setMensaje,
    mensajes,
    setMensajes,
    openMenu,
    setOpenMenu,
    scrollViewRef,
    toggleMenu,
    handleSidebarToggle,
    handleMenuItemPress,
    handleEnviarMensaje,
  };
};