import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useProduccionPolietileno } from '../hooks/useProduccionPolietileno';
import { styles } from './styles/ProduccionPolietileno.styles';

export default function ProduccionPolietileno() {
  const {
    produccionesFiltradas,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    productos,
    turnos,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarProduccion,
  } = useProduccionPolietileno();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#fff', placeholder: '#ccc' },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>🏭 Producción de Polietileno</Text>

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
          <Text style={styles.botonTexto}>➕ Agregar Producción</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Producción' : 'Nueva Producción'}</Text>

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
              <Text style={styles.label}>Turno *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.turno}
                  onValueChange={(value) => handleChange('turno', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item
                    label="Seleccionar turno"
                    value=""
                    style={styles.pickerItemPlaceholder}
                  />
                  {turnos.map((t) => (
                    <Picker.Item
                      key={t}
                      label={t}
                      value={t}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Máquina *"
                value={form.maquina}
                onChangeText={(text) => handleChange('maquina', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
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
                  ) : cargando ? (
                    <Picker.Item
                      label="Cargando productos..."
                      value=""
                      style={styles.pickerItemPlaceholder}
                    />
                  ) : (
                    <Picker.Item
                      label="No hay productos disponibles"
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
              <PaperInput
                label="Operador *"
                value={form.operador}
                onChangeText={(text) => handleChange('operador', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
          </View>

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
        {produccionesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron producciones con esa búsqueda' : 'No hay producciones de polietileno registradas'}
            </Text>
          </View>
        ) : (
          produccionesFiltradas.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.nombre}>{p.productos?.nombre || 'Producto no disponible'}</Text>
              <Text style={styles.info}>📅 Fecha: {p.fecha || '-'}</Text>
              <Text style={styles.info}>⏰ Turno: {p.turno || '-'}</Text>
              <Text style={styles.info}>🏭 Máquina: {p.maquina || '-'}</Text>
              <Text style={styles.info}>📦 Kilos: {p.kilos || '-'}</Text>
              <Text style={styles.info}>👷 Operador: {p.operador || '-'}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarProduccion(p)}
                  style={styles.btnEditar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>✏️ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(p.id)}
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