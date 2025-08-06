import { useLocalSearchParams, useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { supabase } from '../../supabase/client';

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

export const useDashboardAdmin = () => {
  const { correo } = useLocalSearchParams();
  const router = useRouter();
  const { width, height, isPhone, isTablet, isDesktop } = useResponsive();
  const [iaEscribiendo, setIaEscribiendo] = useState(false);
  const [contenidoActual, setContenidoActual] = useState('/pages/DashboardAdmin');
  const [sidebarExpanded, setSidebarExpanded] = useState(!isPhone);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const scrollViewRef = useRef(null);

  const [cargando, setCargando] = useState(false);
  const [metricas, setMetricas] = useState({
    totalPedidos: 0,
    cuentasPorCobrar: 0,
    cuentasPorPagar: 0,
    inventarioCelofan: 0,
    inventarioPolietileno: 0,
    pedidosPorEstado: { Pendiente: 0, Completado: 0, Cancelado: 0 },
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isPhone) {
      setSidebarExpanded(false);
    } else {
      setDrawerVisible(false);
    }
  }, [isPhone]);

  const fetchMetricas = async () => {
    try {
      setCargando(true);
      setError(null);

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id, estado');

      const { data: cobrarData, error: cobrarError } = await supabase
        .from('cuentas_por_cobrar')
        .select('importe')
        .eq('estado', 'pendiente');

      const { data: pagarData, error: pagarError } = await supabase
        .from('cuentas_por_pagar')
        .select('importe')
        .eq('estado', 'Pendiente');

      const { data: celofanData, error: celofanError } = await supabase
        .from('almacen_celofan_movimientos')
        .select('millares, movimiento');

      const { data: polietilenoData, error: polietilenoError } = await supabase
        .from('almacen_polietileno_movimientos')
        .select('kilos, movimiento');

      if (pedidosError || cobrarError || pagarError || celofanError || polietilenoError) {
        throw new Error('Error al obtener datos financieros');
      }

      const cuentasPorCobrar = cobrarData ? cobrarData.reduce((sum, c) => sum + (c.importe || 0), 0) : 0;
      const cuentasPorPagar = pagarData ? pagarData.reduce((sum, c) => sum + (c.importe || 0), 0) : 0;
      const inventarioCelofan = celofanData
        ? celofanData.reduce((sum, m) => sum + (m.movimiento === 'Entrada' ? m.millares : -m.millares), 0)
        : 0;
      const inventarioPolietileno = polietilenoData
        ? polietilenoData.reduce((sum, m) => sum + (m.movimiento === 'Entrada' ? m.kilos : -m.kilos), 0)
        : 0;
      const pedidosPorEstado = pedidosData
        ? pedidosData.reduce(
            (acc, p) => ({
              ...acc,
              [p.estado]: (acc[p.estado] || 0) + 1,
            }),
            { Pendiente: 0, Completado: 0, Cancelado: 0 }
          )
        : { Pendiente: 0, Completado: 0, Cancelado: 0 };

      setMetricas({
        totalPedidos: pedidosData ? pedidosData.length : 0,
        cuentasPorCobrar,
        cuentasPorPagar,
        inventarioCelofan,
        inventarioPolietileno,
        pedidosPorEstado,
      });
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      setError('Error al cargar los datos financieros. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMetricas();
  }, []);

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
    cargando,
    metricas,
    error,
    fetchMetricas,
    toggleMenu,
    handleSidebarToggle,
    handleMenuItemPress,
    handleEnviarMensaje,
  };
};