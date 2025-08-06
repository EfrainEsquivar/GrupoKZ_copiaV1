import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useCuentasPorPagar } from '../hooks/useCuentasPorPagar';
import { styles } from './styles/CuentasPorPagar.styles';

export default function CuentasPorPagar() {
  const {
    cuentasFiltradas,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    showDatePicker,
    setShowDatePicker,
    form,
    gastos,
    estados,
    handleChange,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarCuenta,
    formatTimestamp,
  } = useCuentasPorPagar();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#ffffff', placeholder: '#ccc' },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>💸 Cuentas por Pagar</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ffffff" />
        <TextInput
          placeholder="Buscar por proveedor, estado o descripción"
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
          <Text style={styles.botonTexto}>➕ Agregar Cuenta</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Cuenta' : 'Nueva Cuenta'}</Text>
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
                label="Proveedor *"
                value={form.proveedor}
                onChangeText={(text) => handleChange('proveedor', text)}
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
              <Text style={styles.label}>Estado *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.estado}
                  onValueChange={(value) => handleChange('estado', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item
                    label="Seleccionar estado"
                    value=""
                    style={styles.pickerItemPlaceholder}
                  />
                  {estados.map((e) => (
                    <Picker.Item key={e} label={e} value={e} style={styles.pickerItem} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Descripción"
                value={form.descripcion}
                onChangeText={(text) => handleChange('descripcion', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Gasto (Opcional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.gasto_id}
                  onValueChange={(value) => handleChange('gasto_id', value)}
                  style={styles.picker}
                  enabled={!cargando}
                  mode="dropdown"
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item
                    label="Sin gasto"
                    value=""
                    style={styles.pickerItemPlaceholder}
                  />
                  {gastos.map((g) => (
                    <Picker.Item
                      key={g.id}
                      label={g.concepto}
                      value={g.id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
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
        {cuentasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda
                ? 'No se encontraron cuentas con esa búsqueda'
                : 'No hay cuentas por pagar registradas'}
            </Text>
          </View>
        ) : (
          cuentasFiltradas.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.nombre}>{c.proveedor}</Text>
              <Text style={styles.info}>📅 Fecha: {c.fecha}</Text>
              <Text style={styles.info}>💰 Importe: ${c.importe.toLocaleString('es-CO')}</Text>
              <Text style={styles.info}>📋 Estado: {c.estado}</Text>
              <Text style={styles.info}>📝 Descripción: {c.descripcion || 'N/A'}</Text>
              <Text style={styles.info}>🧾 Gasto: {c.gastos?.concepto || 'N/A'}</Text>
              <Text style={styles.info}>📅 Creado: {formatTimestamp(c.created_at)}</Text>
              <Text style={styles.info}>📅 Actualizado: {formatTimestamp(c.updated_at)}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarCuenta(c)}
                  style={styles.btnEditar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>✏️ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(c.id)}
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
