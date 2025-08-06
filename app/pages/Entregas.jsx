import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useEntregas } from '../hooks/useEntregas';
import { styles } from './styles/Entregas.styles';

export default function Entregas() {
  const {
    entregas,
    form,
    editando,
    mostrarFormulario,
    setMostrarFormulario,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
  } = useEntregas();

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarText}>Menú</Text>
        <TouchableOpacity><Text style={styles.sidebarItem}>Clientes</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Productos</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Entregas</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Entregas</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => {
            resetForm();
            setMostrarFormulario(true);
          }}>
            <Text style={styles.saveButtonText}>Agregar Entrega</Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <>
            <TextInput style={styles.input} placeholder="Nota Venta ID" value={form.nota_venta_id} onChangeText={(text) => handleChange('nota_venta_id', text)} />
            <TextInput style={styles.input} placeholder="Producto ID" value={form.producto_id} onChangeText={(text) => handleChange('producto_id', text)} />
            <TextInput style={styles.input} placeholder="Cantidad" value={form.cantidad} onChangeText={(text) => handleChange('cantidad', text)} />
            <TextInput style={styles.input} placeholder="Unidades" value={form.unidades} onChangeText={(text) => handleChange('unidades', text)} />
            <TextInput style={styles.input} placeholder="Fecha Entrega (YYYY-MM-DD)" value={form.fecha_entrega} onChangeText={(text) => handleChange('fecha_entrega', text)} />

            <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
              <Text style={styles.saveButtonText}>{editando ? 'Actualizar' : 'Guardar'} Entrega</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {entregas.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Producto ID: {item.producto_id}</Text>
              <Text style={styles.cardText}>Cantidad: {item.cantidad} {item.unidades}</Text>
              <Text style={styles.cardText}>Nota Venta ID: {item.nota_venta_id}</Text>
              <Text style={styles.cardText}>Fecha: {item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleDateString() : 'Sin fecha'}</Text>
            </View>
            <View style={styles.cardButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEditar(item)}>
                <Text style={styles.buttonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleEliminar(item.id)}>
                <Text style={styles.buttonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}