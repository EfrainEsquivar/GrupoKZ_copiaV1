import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Pagination } from './Pagination';

export const PedidosList = ({ 
  styles, 
  pedidos, 
  busqueda, 
  setBusqueda, 
  setMostrarFormulario, 
  setMostrarDetalles, 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange 
}) => (
  <View style={styles.container}>
    <Text style={styles.title}>📦 Gestión de Pedidos</Text>

    <View style={styles.buscador}>
      <Ionicons name="search" size={20} color="#ffffff" />
      <TextInput
        placeholder="Buscar por cliente, producto o estado"
        placeholderTextColor="#ffffff"
        style={styles.inputText}
        value={busqueda}
        onChangeText={setBusqueda}
      />
    </View>

    <View style={styles.botoneraDerecha}>
      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => setMostrarFormulario(true)}
      >
        <Text style={styles.botonTexto}>➕ Nuevo Pedido</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.lista}>
      {pedidos.length === 0 ? (
        <Text style={styles.emptyText}>No hay pedidos registrados</Text>
      ) : (
        pedidos.map((pedido) => (
          <TouchableOpacity key={pedido.id} onPress={() => setMostrarDetalles(pedido)}>
            <View style={styles.card}>
              <Text style={styles.nombre}>
                {pedido.notas_venta?.clientes?.nombre_contacto || 'Cliente no especificado'}
              </Text>
              <Text style={styles.info}>
                Empresa: {pedido.notas_venta?.clientes?.empresa || 'Sin empresa'}
              </Text>
              <Text style={styles.info}>
                Fecha: {pedido.notas_venta?.fecha || 'Sin fecha'}
              </Text>
              <Text style={styles.info}>
                Total: ${(pedido.notas_venta?.total ?? 0).toLocaleString('es-CO')}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>

    <Pagination 
      currentPage={currentPage} 
      totalPages={totalPages} 
      totalItems={totalItems} 
      onPageChange={onPageChange} 
    />
  </View>
);         