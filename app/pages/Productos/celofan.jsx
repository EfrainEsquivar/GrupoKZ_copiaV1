import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useCelofan } from '../../hooks/useCelofan';
import { styles } from './styles/celofan.styles';

export default function Celofan() {
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
    micrajeTipos,
    gramajeTipos,
    productosFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarProducto,
  } = useCelofan();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#ffffff', placeholder: '#ccc' },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Productos de Celofán</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ffffff" />
        <TextInput
          placeholder="Buscar por nombre o tipo"
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
            <ActivityIndicator color="#ffffff" size="small" />
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
            <ActivityIndicator color="#ffffff" size="small" />
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
                  dropdownIconColor="#ffffff"
                  mode="dropdown"
                >
                  <Picker.Item label="Seleccionar presentación" value="" color="#ccc" />
                  {presentaciones.map((p) => (
                    <Picker.Item key={p} label={p} value={p} color="#ffffff" />
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
                >
                  <Picker.Item label="Seleccionar tipo" value="" color="#ffffff" />
                  {(form.presentacion === 'Micraje' ? micrajeTipos : form.presentacion === 'Gramaje' ? gramajeTipos : []).map((t) => (
                    <Picker.Item key={t} label={t} value={t} color="#ffffff" />
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
              <Text style={styles.label}>{form.presentacion === 'Micraje' ? 'Micraje (µm) *' : form.presentacion === 'Gramaje' ? 'Gramaje *' : ''}</Text>
              {form.presentacion === 'Micraje' ? (
                <PaperInput
                  label="Micraje (µm) *"
                  value={form.valor}
                  onChangeText={(text) => handleChange('valor', text)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  theme={inputTheme}
                  textColor="#ffffff"
                  placeholder="Ingrese micraje"
                  disabled={cargando || form.presentacion !== 'Micraje'}
                />
              ) : form.presentacion === 'Gramaje' ? (
                <PaperInput
                  label="Gramaje *"
                  value={form.valor}
                  onChangeText={(text) => handleChange('valor', text)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  theme={inputTheme}
                  textColor="#ffffff"
                  disabled={cargando || form.presentacion !== 'Gramaje'}
                />
              ) : null}
            </View>
          </View>
          <View style={styles.botonesForm}>
            <TouchableOpacity
              style={styles.btnGuardar}
              onPress={handleGuardar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#ffffff" size="small" />
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
              {busqueda ? 'No se encontraron productos con esa búsqueda' : 'No hay productos de celofán registrados'}
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
              <Text style={styles.info}>📏 {p.micraje ? `Micraje: ${p.micraje} µm` : `Gramaje: ${p.gramaje || 'N/A'}`}</Text>
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