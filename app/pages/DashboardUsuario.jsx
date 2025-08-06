import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ChatPanel } from '../components/dashboard/ChatPanel';
import { Header } from '../components/dashboard/Header';
import { SidebarContent } from '../components/dashboard/SidebarContent';
import LogoutButton from '../components/LogoutButton';
import { useDashboardUsuario } from '../hooks/useDashboardUsuario';
import Clientes from '../pages/clientes';
import CuentasPorCobrar from '../pages/CuentasPorCobrar';
import Pedidos from '../pages/Pedidos';
import Celofan from './Productos/celofan';
import Polietileno from './Productos/polietileno';
import { getResponsiveStyles } from './styles/DashboardUsuario.styles';

export default function DashboardUsuario() {
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
    toggleMenu,
    handleSidebarToggle,
    handleMenuItemPress,
    handleEnviarMensaje,
  } = useDashboardUsuario();

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
        {contenidoActual === '/pages/DashboardUsuario' && (
          <Animatable.View animation="fadeInDown" duration={600} style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>👋 Bienvenido, </Text>
            <Text style={styles.welcomeCorreo}>{correo}</Text>
          </Animatable.View>
        )}

        {contenidoActual === '/pages/DashboardUsuario' && (
          <View style={styles.cardGrid}>
            <Animatable.View animation="fadeInUp" delay={200} style={styles.statCard}>
              <FontAwesome5 name="users" size={24} color="#3b82f6" />
              <Text style={styles.statLabel}>Clientes</Text>
              <Text style={styles.statValue}>111</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={300} style={styles.statCard}>
              <FontAwesome5 name="shopping-cart" size={24} color="#22c55e" />
              <Text style={styles.statLabel}>Pedidos</Text>
              <Text style={styles.statValue}>87</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={400} style={styles.statCard}>
              <FontAwesome5 name="wallet" size={24} color="#facc15" />
              <Text style={styles.statLabel}>Cuentas por Cobrar</Text>
              <Text style={styles.statValue}>$10.5M</Text>
            </Animatable.View>
          </View>
        )}

        {contenidoActual === '/pages/clientes' && <Clientes />}
        {contenidoActual === '/pages/pedidos' && <Pedidos />}
        {contenidoActual === '/pages/CuentasPorCobrar' && <CuentasPorCobrar />}
        {contenidoActual === '/pages/productos/celofan' && <Celofan />}
        {contenidoActual === '/pages/productos/polietileno' && <Polietileno />}
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