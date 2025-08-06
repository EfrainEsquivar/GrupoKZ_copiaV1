import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { useCuentasPorCobrar } from '../hooks/useCuentasPorCobrar';
import { styles } from './styles/CuentasPorCobrar.styles';

export default function CuentasPorCobrar() {
  const {
    notasFiltradas,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    showDatePicker,
    setShowDatePicker,
    form,
    clientes,
    handleChange,
    calculateTotal,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarNota,
    formatTimestamp,
  } = useCuentasPorCobrar();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#ffffff', placeholder: '#ccc' },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Cuentas por Cobrar</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ffffff" />
        <TextInput
          placeholder="Buscar por folio o cliente"
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
              <PaperInput
                label="Folio *"
                value={form.folio}
                onChangeText={(text) => handleChange('folio', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
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
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <Text style={styles.label}>Cliente *</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={form.cliente_id}
                  onChange={(e) => handleChange('cliente_id', e.target.value)}
                  style={styles.webSelect}
                >
                  <option value="" style={styles.pickerItemPlaceholder}>
                    Seleccionar cliente
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id} style={styles.pickerItem}>
                      {`${c.nombre_contacto} (${c.empresa || 'N/A'})`}
                    </option>
                  ))}
                </select>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.cliente_id}
                    onValueChange={(value) => handleChange('cliente_id', value)}
                    style={styles.picker}
                    enabled={!cargando}
                    mode="dropdown"
                    dropdownIconColor="#ffffff"
                  >
                    <Picker.Item
                      label="Seleccionar cliente"
                      value=""
                      style={styles.pickerItemPlaceholder}
                    />
                    {clientes.map((c) => (
                      <Picker.Item
                        key={c.id}
                        label={`${c.nombre_contacto} (${c.empresa || 'N/A'})`}
                        value={c.id}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Subtotal *"
                value={form.subtotal}
                onChangeText={(text) => {
                  handleChange('subtotal', text);
                  calculateTotal();
                }}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="IVA"
                value={form.iva}
                onChangeText={(text) => {
                  handleChange('iva', text);
                  calculateTotal();
                }}
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
                label="Total"
                value={form.total}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Pago Pendiente"
                value={form.pago_pendiente}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled
                placeholder="0"
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
        {notasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda
                ? 'No se encontraron cuentas con esa búsqueda'
                : 'No hay cuentas por cobrar registradas'}
            </Text>
          </View>
        ) : (
          notasFiltradas.map((n) => (
            <View key={n.id} style={styles.card}>
              <Text style={styles.nombre}>{n.folio}</Text>
              <Text style={styles.info}>
                👤 {n.clientes.nombre_contacto} ({n.clientes.empresa || 'N/A'})
              </Text>
              <Text style={styles.info}>📅 Fecha: {n.fecha}</Text>
              <Text style={styles.info}>💵 Subtotal: ${n.subtotal.toLocaleString('es-CO')}</Text>
              <Text style={styles.info}>🧾 IVA: ${n.iva.toLocaleString('es-CO')}</Text>
              <Text style={styles.info}>💰 Total: ${n.total.toLocaleString('es-CO')}</Text>
              <Text style={styles.info}>
                ⏳ Pago Pendiente: ${n.pago_pendiente.toLocaleString('es-CO')}
              </Text>
              <Text style={styles.info}>📅 Creado: {formatTimestamp(n.created_at)}</Text>
              <Text style={styles.info}>📅 Actualizado: {formatTimestamp(n.updated_at)}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarNota(n)}
                  style={styles.btnEditar}
                  disabled={cargando}
                >
                  <Text style={styles.botonTexto}>✏️ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(n.id)}
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
