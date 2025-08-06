import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useAlmacenPolietileno } from '../hooks/useAlmacenPolietileno';
import { styles } from './styles/AlmacenPolietileno.styles';

export default function AlmacenPolietileno() {
  const {
    movimientosFiltrados,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    productos,
    producciones,
    entregas,
    movimientosTipos,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarMovimiento,
  } = useAlmacenPolietileno();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#fff', placeholder: '#ccc' },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>📦 Almacén de Polietileno</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          placeholder="Buscar por fecha o producto"
          placeholderTextColor="#ccc"
          style={styles.inputText}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.botoneraDerecha}>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => setMostrarFormulario(true)}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>➕ Agregar Movimiento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={exportarExcel}
          style={styles.btnExportarExcel}
          disabled={cargandoExportar}
        >
          {cargandoExportar ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.botonTexto}>📊 Excel</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={exportarPDF}
          style={styles.btnExportarPDF}
          disabled={cargandoExportar}
        >
          {cargandoExportar ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.botonTexto}>📄 PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.formTitulo}>{form.id ? 'Editar Movimiento' : 'Nuevo Movimiento'}</Text>

          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Fecha *"
                value={form.fecha}
                onChangeText={(text) => handleChange('fecha', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Producto *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.producto_id}
                  onValueChange={(value) => handleChange('producto_id', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item
                    label="Seleccionar producto"
                    value=""
                    style={styles.pickerItemPlaceholder}
                  />
                  {productos.length > 0 ? (
                    productos.map((p) => (
                      <Picker.Item
                        key={p.id}
                        label={p.nombre}
                        value={p.id.toString()}
                        style={styles.pickerItem}
                      />
                    ))
                  ) : (
                    <Picker.Item
                      label="Cargando productos..."
                      value=""
                      style={styles.pickerItemPlaceholder}
                    />
                  )}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Kilos *"
                value={form.kilos === '0' ? '' : form.kilos}
                onChangeText={(text) => handleChange('kilos', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Movimiento *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.movimiento}
                  onValueChange={(value) => {
                    handleChange('movimiento', value);
                    handleChange('produccion_id', '');
                    handleChange('entrega_id', '');
                  }}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item
                    label="Seleccionar movimiento"
                    value=""
                    style={styles.pickerItemPlaceholder}
                  />
                  {movimientosTipos.map((m) => (
                    <Picker.Item
                      key={m}
                      label={m}
                      value={m}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {form.movimiento === 'Entrada' && (
            <View style={styles.row2}>
              <View style={styles.col2}>
                <Text style={styles.label}>Producción *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.produccion_id}
                    onValueChange={(value) => handleChange('produccion_id', value)}
                    style={styles.picker}
                    enabled={!cargando}
                    mode="dropdown"
                    dropdownIconColor="#ffffff"
                  >
                    <Picker.Item
                      label="Seleccionar producción"
                      value=""
                      style={styles.pickerItemPlaceholder}
                    />
                    {producciones.length > 0 ? (
                      producciones.map((p) => (
                        <Picker.Item
                          key={p.id}
                          label={p.fecha}
                          value={p.id.toString()}
                          style={styles.pickerItem}
                        />
                      ))
                    ) : (
                      <Picker.Item
                        label="Cargando producciones..."
                        value=""
                        style={styles.pickerItemPlaceholder}
                      />
                    )}
                  </Picker>
                </View>
              </View>
              <View style={styles.col2}></View>
            </View>
          )}

          {form.movimiento === 'Salida' && (
            <View style={styles.row2}>
              <View style={styles.col2}>
                <Text style={styles.label}>Entrega *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.entrega_id}
                    onValueChange={(value) => handleChange('entrega_id', value)}
                    style={styles.picker}
                    enabled={!cargando}
                    mode="dropdown"
                    dropdownIconColor="#ffffff"
                  >
                    <Picker.Item
                      label="Seleccionar entrega"
                      value=""
                      style={styles.pickerItemPlaceholder}
                    />
                    {entregas.length > 0 ? (
                      entregas.map((e) => (
                        <Picker.Item
                          key={e.id}
                          label={e.fecha_entrega}
                          value={e.id.toString()}
                          style={styles.pickerItem}
                        />
                      ))
                    ) : (
                      <Picker.Item
                        label="Cargando entregas..."
                        value=""
                        style={styles.pickerItemPlaceholder}
                      />
                    )}
                  </Picker>
                </View>
              </View>
              <View style={styles.col2}></View>
            </View>
          )}

          <View style={styles.botonesForm}>
            <TouchableOpacity
              style={styles.btnGuardar}
              onPress={handleGuardar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.botonTexto}>{form.id ? 'Actualizar' : 'Guardar'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={resetForm}
              disabled={cargando}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {cargando && !mostrarFormulario && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}

      <ScrollView style={styles.lista}>
        {movimientosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron movimientos con esa búsqueda' : 'No hay movimientos de almacén de polietileno registrados'}
            </Text>
          </View>
        ) : (
          movimientosFiltrados.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.nombre}>{m.productos?.nombre || '-'}</Text>
              <Text style={styles.info}>📅 Fecha: {m.fecha || '-'}</Text>
              <Text style={styles.info}>📦 Kilos: {m.kilos || '-'}</Text>
              <Text style={styles.info}>↔️ Movimiento: {m.movimiento || '-'}</Text>
              <Text style={styles.info}>🏭 Producción: {m.produccion_polietileno?.fecha || '-'}</Text>
              <Text style={styles.info}>🚚 Entrega: {m.entregas?.fecha_entrega || '-'}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarMovimiento(m)}
                  style={styles.btnEditar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>✏️ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(m.id)}
                  style={styles.btnEliminar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
