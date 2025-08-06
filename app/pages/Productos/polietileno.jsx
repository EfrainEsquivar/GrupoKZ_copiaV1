import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { usePolietileno } from '../../hooks/usePolietileno';
import { styles } from './styles/polietileno.styles';

export default function Polietileno() {
  const {
    productos,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    presentaciones,
    tipos,
    productosFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarProducto,
  } = usePolietileno();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#fff', placeholder: '#ccc' },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Productos de Polietileno</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          placeholder="Buscar por nombre o tipo"
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
          <Text style={styles.botonTexto}>➕ Agregar Producto</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Producto' : 'Nuevo Producto'}</Text>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Nombre *"
                value={form.nombre}
                editable={false}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Presentación *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.presentacion}
                  onValueChange={(value) => handleChange('presentacion', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                >
                  <Picker.Item label="Seleccionar presentación" value="" color="#fff" />
                  {presentaciones.map((p) => (
                    <Picker.Item key={p} label={p} value={p} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.tipo}
                  onValueChange={(value) => handleChange('tipo', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                >
                  <Picker.Item label="Seleccionar tipo" value="" color="#fff" />
                  {tipos.map((t) => (
                    <Picker.Item key={t} label={t} value={t} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Ancho (cm)"
                value={form.ancho_cm}
                onChangeText={(text) => handleChange('ancho_cm', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Largo (cm)"
                value={form.largo_cm}
                onChangeText={(text) => handleChange('largo_cm', text)}
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
                label="Micraje (µm) *"
                value={form.micraje}
                onChangeText={(text) => handleChange('micraje', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
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
        {productosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron productos con esa búsqueda' : 'No hay productos de polietileno registrados'}
            </Text>
          </View>
        ) : (
          productosFiltrados.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.nombre}>{p.nombre}</Text>
              <Text style={styles.info}>📦 Presentación: {p.presentacion}</Text>
              <Text style={styles.info}>🎨 Tipo: {p.tipo}</Text>
              <Text style={styles.info}>📏 Ancho: {p.ancho_cm || 'N/A'} cm</Text>
              <Text style={styles.info}>📏 Largo: {p.largo_cm || 'N/A'} cm</Text>
              <Text style={styles.info}>📏 Micraje: {p.micraje} µm</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarProducto(p)}
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
    </View>
  );
}