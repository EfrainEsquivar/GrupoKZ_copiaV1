import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useGastos } from '../hooks/useGastos';
import { styles } from './styles/Gastos.styles';

export default function Gastos() {
  const {
    gastosFiltrados,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    showDatePicker,
    setShowDatePicker,
    form,
    handleChange,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarGasto,
    formatTimestamp,
  } = useGastos();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#ffffff', placeholder: '#ccc' },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💸 Lista de Gastos</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ffffff" />
        <TextInput
          placeholder="Buscar por concepto o categoría"
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
          <Text style={styles.botonTexto}>➕ Agregar Gasto</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Gasto' : 'Nuevo Gasto'}</Text>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
                disabled={cargando}
              >
                <PaperInput
                  label="Fecha *"
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
                label="Concepto *"
                value={form.concepto}
                onChangeText={(text) => handleChange('concepto', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Importe *"
                value={form.importe}
                onChangeText={(text) => handleChange('importe', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
                placeholder="0"
              />
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Categoría"
                value={form.categoria}
                onChangeText={(text) => handleChange('categoria', text)}
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
        {gastosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron gastos con esa búsqueda' : 'No hay gastos registrados'}
            </Text>
          </View>
        ) : (
          gastosFiltrados.map((g) => (
            <View key={g.id} style={styles.card}>
              <Text style={styles.nombre}>{g.concepto}</Text>
              <Text style={styles.info}>📅 Fecha: {g.fecha}</Text>
              <Text style={styles.info}>💰 Importe: ${g.importe.toLocaleString('es-CO')}</Text>
              <Text style={styles.info}>🏷️ Categoría: {g.categoria || 'Sin categoría'}</Text>
              <Text style={styles.info}>📅 Creado: {formatTimestamp(g.created_at)}</Text>
              <Text style={styles.info}>📅 Actualizado: {formatTimestamp(g.updated_at)}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarGasto(g)}
                  style={styles.btnEditar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>✏️ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(g.id)}
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
