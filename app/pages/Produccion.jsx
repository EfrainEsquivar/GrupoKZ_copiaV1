import { Picker } from '@react-native-picker/picker';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useProduccion } from '../hooks/useProduccion';
import { styles } from './styles/Produccion.styles';

export default function Produccion() {
  const {
    producciones,
    productos,
    mostrarFormulario,
    setMostrarFormulario,
    editando,
    form,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
  } = useProduccion();

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarText}>Menú</Text>
        <TouchableOpacity><Text style={styles.sidebarItem}>Clientes</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Productos</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Producción</Text></TouchableOpacity>
      </View>

      {/* CONTENIDO */}
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Producción</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => {
            resetForm();
            setMostrarFormulario(true);
          }}>
            <Text style={styles.saveButtonText}>Agregar Producción</Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <>
            <TextInput style={styles.input} placeholder="Fecha (YYYY-MM-DD)" value={form.fecha} onChangeText={(text) => handleChange('fecha', text)} />

            <View style={styles.input}>
              <Picker selectedValue={form.turno} onValueChange={(value) => handleChange('turno', value)}>
                <Picker.Item label="Selecciona turno" value="" />
                <Picker.Item label="Mañana" value="Mañana" />
                <Picker.Item label="Tarde" value="Tarde" />
                <Picker.Item label="Noche" value="Noche" />
              </Picker>
            </View>

            <TextInput style={styles.input} placeholder="Máquina" value={form.maquina} onChangeText={(text) => handleChange('maquina', text)} />

            <View style={styles.input}>
              <Picker selectedValue={form.material} onValueChange={(value) => handleChange('material', value)}>
                <Picker.Item label="Selecciona material" value="" />
                <Picker.Item label="Polietileno" value="Polietileno" />
                <Picker.Item label="Celofán" value="Celofán" />
              </Picker>
            </View>

            <View style={styles.input}>
              <Picker selectedValue={form.producto_id} onValueChange={(value) => handleChange('producto_id', value)}>
                <Picker.Item label="Selecciona producto" value="" />
                {productos.map(p => (
                  <Picker.Item key={p.id} label={p.nombre} value={p.id.toString()} />
                ))}
              </Picker>
            </View>

            <TextInput style={styles.input} placeholder="Cantidad" value={form.cantidad} onChangeText={(text) => handleChange('cantidad', text)} keyboardType="numeric" />

            <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
              <Text style={styles.saveButtonText}>{editando ? 'Actualizar' : 'Guardar'} Producción</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {producciones.map((item) => {
          const productoNombre = productos.find(p => p.id === item.producto_id)?.nombre || 'Desconocido';
          return (
            <View key={item.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Fecha: {item.fecha}</Text>
                <Text style={styles.cardText}>Turno: {item.turno} | Material: {item.material}</Text>
                <Text style={styles.cardText}>Producto: {productoNombre} | Cantidad: {item.cantidad}</Text>
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
          );
        })}
      </ScrollView>
    </View>
  );
}