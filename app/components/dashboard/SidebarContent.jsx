import { FontAwesome5 } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LogoutButton from '../LogoutButton';

const menuItems = [
  { nombre: 'Panel', icono: 'home', ruta: '/pages/DashboardAdmin' },
  {
    nombre: 'Finanzas', icono: 'wallet', hijos: [
      { nombre: 'Gastos', ruta: '/pages/Gastos' },
      { nombre: 'Cuentas por cobrar', ruta: '/pages/CuentasPorCobrar' },
      { nombre: 'Cuentas por pagar', ruta: '/pages/CuentasPorPagar' },
    ]
  },
  {
    nombre: 'Productos', icono: 'box-open', hijos: [
      { nombre: 'Celofán', ruta: '/pages/productos/celofan' },
      { nombre: 'Polietileno', ruta: '/pages/productos/polietileno' },
    ]
  },
  { nombre: 'Pedidos', icono: 'shopping-cart', ruta: '/pages/pedidos' },
  { nombre: 'Clientes', icono: 'user-friends', ruta: '/pages/clientes' },
  { nombre: 'Vendedores', icono: 'user-tie', ruta: '/pages/Vendedores' },
  {
    nombre: 'Producción', icono: 'industry', hijos: [
      { nombre: 'Producción Celofán', ruta: '/pages/ProduccionCelofan' },
      { nombre: 'Producción Polietileno', ruta: '/pages/ProduccionPolietileno' },
    ]
  },
  {
    nombre: 'Almacén', icono: 'store', hijos: [
      { nombre: 'Almacén Celofán', ruta: '/pages/AlmacenCelofan' },
      { nombre: 'Almacén Polietileno', ruta: '/pages/AlmacenPolietileno' },
    ]
  },
];

export const SidebarContent = ({ styles, onItemPress, sidebarExpanded, isPhone, openMenu, toggleMenu, contenidoActual }) => (
  <ScrollView contentContainerStyle={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
    {menuItems.map((item, index) => (
      <View key={index}>
        <TouchableOpacity
          onPress={() => {
            if (item.hijos) {
              toggleMenu(item.nombre);
            } else {
              onItemPress(item.ruta);
            }
          }}
          style={[
            styles.menuItem,
            contenidoActual === item.ruta && styles.menuItemActive
          ]}
        >
          <View style={[styles.menuLeft, !sidebarExpanded && styles.iconOnly]}>
            <FontAwesome5 
              name={item.icono} 
              size={14} 
              color={contenidoActual === item.ruta ? '#3b82f6' : '#94a3b8'} 
              style={styles.icon} 
            />
            {(sidebarExpanded || isPhone) && (
              <Text style={[
                styles.menuText,
                contenidoActual === item.ruta && { color: '#3b82f6' }
              ]}>
                {item.nombre}
              </Text>
            )}
          </View>
          {(sidebarExpanded || isPhone) && item.hijos && (
            <FontAwesome5
              name={openMenu === item.nombre ? 'chevron-down' : 'chevron-right'}
              size={10}
              color="#94a3b8"
              style={styles.arrowIcon}
            />
          )}
        </TouchableOpacity>
        
        {(sidebarExpanded || isPhone) && item.hijos && openMenu === item.nombre && (
          <View style={styles.submenu}>
            {item.hijos.map((sub, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => onItemPress(sub.ruta)} 
                style={[
                  styles.submenuItem,
                  contenidoActual === sub.ruta && styles.submenuItemActive
                ]}
              >
                <View style={styles.submenuDot} />
                <Text style={[
                  styles.submenuText,
                  contenidoActual === sub.ruta && { color: '#3b82f6' }
                ]}>
                  {sub.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    ))}
  </ScrollView>
);