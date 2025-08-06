import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';

export const PedidoForm = ({ 
  styles, 
  form, 
  setForm, 
  clientes, 
  vendedores, 
  productos, 
  productosSeleccionados, 
  setProductosSeleccionados, 
  detalleForm, 
  setDetalleForm, 
  showDatePicker, 
  setShowDatePicker, 
  handleDateChange, 
  handleGuardar, 
  resetForm, 
  handleAñadirProducto, 
  handleEliminarProducto, 
  handleEditarProducto, 
  mostrarFormularioProducto, 
  setMostrarFormularioProducto, 
  cargando 
}) => {
  const inputTheme = {
    colors: {
      primary: '#3b82f6',
      text: '#ffffff',
      placeholder: '#ccc',
      background: '#1e293b',
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{form.id ? 'Editar Pedido' : 'Nuevo Pedido'}</Text>

      <ScrollView>
        <View style={styles.row2}>
          <View style={styles.col2}>
            <Text style={styles.label}>Cliente</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.cliente_id}
                onValueChange={(value) => setForm({ ...form, cliente_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar cliente" value="" />
                {clientes.map((c) => (
                  <Picker.Item key={c.id} label={`${c.nombre_contacto} (${c.empresa})`} value={c.id} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.col2}>
            <Text style={styles.label}>Vendedor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.vendedor_id}
                onValueChange={(value) => setForm({ ...form, vendedor_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar vendedor" value="" />
                {vendedores.map((v) => (
                  <Picker.Item key={v.id} label={v.nombre} value={v.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row2}>
          <View style={styles.col2}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <PaperInput
                label="Fecha"
                value={form.fecha}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                editable={false}
                right={<PaperInput.Icon name="calendar" color="#ffffff" />}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(form.fecha)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          <View style={styles.col2}>
            <PaperInput
              label="Número de Factura"
              value={form.numero_factura}
              onChangeText={(text) => setForm({ ...form, numero_factura: text })}
              mode="outlined"
              style={styles.input}
              theme={inputTheme}
              textColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.productosSection}>
          <Text style={styles.subTitle}>Productos</Text>
          <TouchableOpacity style={styles.btnAnadirProducto} onPress={() => setMostrarFormularioProducto(true)}>
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.btnAnadirTexto}>Añadir Producto</Text>
          </TouchableOpacity>

          {mostrarFormularioProducto && (
            <View style={styles.formularioProducto}>
              <View style={styles.row2}>
                <View style={styles.col2}>
                  <Text style={styles.label}>Producto</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={detalleForm.productos_id}
                      onValueChange={(value) => setDetalleForm({ ...detalleForm, productos_id: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccionar producto" value="" />
                      {productos.map((p) => (
                        <Picker.Item key={p.id} label={`${p.nombre} (${p.material})`} value={p.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.col2}>
                  <PaperInput
                    label="Cantidad"
                    value={detalleForm.cantidad}
                    onChangeText={(text) => setDetalleForm({ ...detalleForm, cantidad: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    theme={inputTheme}
                    textColor="#ffffff"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.btnGuardarProducto} onPress={handleAñadirProducto}>
                <Text style={styles.botonTexto}>Añadir</Text>
              </TouchableOpacity>
            </View>
          )}

          {productosSeleccionados.map((producto, index) => (
            <View key={index} style={styles.tablaFila}>
              <Text style={[styles.tablaCeldaTexto, { flex: 3 }]}>{producto.nombre}</Text>
              <Text style={[styles.tablaCeldaTexto, { flex: 1 }]}>{producto.cantidad}</Text>
              <Text style={[styles.tablaCeldaTexto, { flex: 1 }]}>${producto.precio_unitario_con_iva}</Text>
              <Text style={[styles.tablaCeldaTexto, { flex: 1 }]}>${producto.subtotal}</Text>
              <TouchableOpacity onPress={() => handleEditarProducto(producto, index)}>
                <Ionicons name="pencil" size={16} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEliminarProducto(index)}>
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.botonesForm}>
          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.botonTexto}>Guardar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancelar} onPress={resetForm} disabled={cargando}>
            <Text style={styles.botonTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};