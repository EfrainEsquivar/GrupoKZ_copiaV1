import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ChatPanel } from '../components/dashboard/ChatPanel';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { Header } from '../components/dashboard/Header';
import { SidebarContent } from '../components/dashboard/SidebarContent';
import LogoutButton from '../components/LogoutButton';
import { useDashboardAdmin } from '../hooks/useDashboardAdmin';
import AlmacenCelofan from '../pages/AlmacenCelofan';
import AlmacenPolietileno from '../pages/AlmacenPolietileno';
import CuentasPorCobrar from '../pages/CuentasPorCobrar';
import CuentasPorPagar from '../pages/CuentasPorPagar';
import Gastos from '../pages/Gastos';
import Pedidos from '../pages/Pedidos';
import ProduccionCelofan from '../pages/ProduccionCelofan';
import ProduccionPolietileno from '../pages/ProduccionPolietileno';
import Vendedores from '../pages/Vendedores';
import Clientes from './clientes';
import Celofan from './Productos/celofan';
import Polietileno from './Productos/polietileno';
import { getResponsiveStyles } from './styles/DashboardAdmin.styles';

export default function DashboardAdmin() {
  const {
    correo,
    router,
    width,
    height,
    isPhone,
    isTablet,
    iaEscribiendo,
    contenidoActual,
    setContenidoActual,
    sidebarExpanded,
    drawerVisible,
    setDrawerVisible,
    chatVisible,
    setChatVisible,
    mensaje,
    setMensaje,
    mensajes,
    openMenu,
    setOpenMenu,
    scrollViewRef,
    cargando,
    metricas,
    error,
    toggleMenu,
    handleSidebarToggle,
    handleMenuItemPress,
    handleEnviarMensaje,
  } = useDashboardAdmin();

  const styles = getResponsiveStyles(width, height, isPhone, isTablet, sidebarExpanded, chatVisible);

  const MobileDrawer = () => (
    <Modal
      visible={drawerVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setDrawerVisible(false)}
    >
      <TouchableOpacity 
        style={styles.drawerOverlay}
        activeOpacity={1}
        onPress={() => setDrawerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.drawerContent}
          activeOpacity={1}
        >
          <SidebarContent 
            styles={styles} 
            onItemPress={handleMenuItemPress} 
            sidebarExpanded={sidebarExpanded} 
            isPhone={isPhone} 
            openMenu={openMenu} 
            toggleMenu={toggleMenu} 
            contenidoActual={contenidoActual} 
          />
          <View style={styles.logoutContainer}>
            <LogoutButton />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header 
        styles={styles} 
        isPhone={isPhone} 
        handleSidebarToggle={handleSidebarToggle} 
        setOpenMenu={setOpenMenu} 
        openMenu={openMenu} 
        router={router} 
      />

      {isPhone && <MobileDrawer />}

      {!isPhone && (
        <View style={[styles.sidebar, sidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed]}>
          <SidebarContent 
            styles={styles} 
            onItemPress={setContenidoActual} 
            sidebarExpanded={sidebarExpanded} 
            isPhone={isPhone} 
            openMenu={openMenu} 
            toggleMenu={toggleMenu} 
            contenidoActual={contenidoActual} 
          />
          <View style={styles.logoutContainer}>
            <LogoutButton />
          </View>
        </View>
      )}

      {!isPhone && (
        <Animatable.View
          animation="pulse"
          duration={300}
          iterationCount={1}
          style={styles.floatingToggle}
        >
          <TouchableOpacity onPress={handleSidebarToggle}>
            <LinearGradient
              colors={['rgba(59,130,246,0.5)', '#1e293b']}
              locations={[0, 0.4]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.toggleSidebarBtn}
            >
              <Animatable.View
                animation={sidebarExpanded ? 'rotate' : 'rotate'}
                duration={300}
                key={sidebarExpanded ? 'left' : 'right'}
              >
                <FontAwesome5
                  name={sidebarExpanded ? 'chevron-left' : 'chevron-right'}
                  size={16}
                  color="#ffffff"
                />
              </Animatable.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {contenidoActual === '/pages/DashboardAdmin' && (
          <Animatable.View animation="fadeInDown" duration={600} style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>👋 Bienvenido, </Text>
            <Text style={styles.welcomeCorreo}>{correo}</Text>
          </Animatable.View>
        )}

        {contenidoActual === '/pages/DashboardAdmin' && (
          <DashboardSummary styles={styles} cargando={cargando} error={error} metricas={metricas} />
        )}

        {contenidoActual === '/pages/clientes' && <Clientes />}
        {contenidoActual === '/pages/Vendedores' && <Vendedores />}
        {contenidoActual === '/pages/Gastos' && <Gastos />}
        {contenidoActual === '/pages/CuentasPorCobrar' && <CuentasPorCobrar />}
        {contenidoActual === '/pages/CuentasPorPagar' && <CuentasPorPagar />}
        {contenidoActual === '/pages/productos/celofan' && <Celofan />}
        {contenidoActual === '/pages/productos/polietileno' && <Polietileno />}
        {contenidoActual === '/pages/pedidos' && <Pedidos />}
        {contenidoActual === '/pages/ProduccionCelofan' && <ProduccionCelofan />}
        {contenidoActual === '/pages/ProduccionPolietileno' && <ProduccionPolietileno />}
        {contenidoActual === '/pages/AlmacenCelofan' && <AlmacenCelofan />}
        {contenidoActual === '/pages/AlmacenPolietileno' && <AlmacenPolietileno />}
      </ScrollView>

      {!chatVisible && (
        <TouchableOpacity style={styles.botonToggleChat} onPress={() => setChatVisible(true)}>
          <FontAwesome5 name="comments" solid size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {chatVisible && (
        <ChatPanel 
          styles={styles} 
          chatVisible={chatVisible} 
          setChatVisible={setChatVisible} 
          isPhone={isPhone} 
          mensajes={mensajes} 
          iaEscribiendo={iaEscribiendo} 
          mensaje={mensaje} 
          setMensaje={setMensaje} 
          handleEnviarMensaje={handleEnviarMensaje} 
          scrollViewRef={scrollViewRef} 
        />
      )}
    </View>
  );
}