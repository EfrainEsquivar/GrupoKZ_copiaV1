import { FontAwesome5 } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export const Header = ({ styles, isPhone, handleSidebarToggle, setOpenMenu, openMenu, router }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      {isPhone && (
        <TouchableOpacity 
          onPress={handleSidebarToggle}
          style={{ marginRight: 15, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <FontAwesome5 name="bars" size={18} color="#fff" />
        </TouchableOpacity>
      )}
      <Image source={require('../../../assets/logo1.png')} style={styles.headerLogo} />
      <Text style={styles.headerTitle}>AIKZ</Text>
    </View>

    <TouchableOpacity onPress={() => setOpenMenu(openMenu === 'perfil' ? null : 'perfil')}>
      <Image
        source={{ uri: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' }}
        style={styles.profileImage}
      />
    </TouchableOpacity>

    {openMenu === 'perfil' && (
      <View style={styles.profileMenu}>
        <TouchableOpacity 
          onPress={() => {
            setOpenMenu(null);
            router.replace('/');
          }}
          style={{ minHeight: 44 }}
        >
          <Text style={styles.menuItemText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);