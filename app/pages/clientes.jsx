import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInput as PaperInput } from 'react-native-paper';
import { useClientes } from '../hooks/useClientes';
import { styles } from './styles/clientes.styles';

export default function Clientes() {
  const {
    openEstado,
    setOpenEstado,
    itemsEstado,
    setItemsEstado,
    openVendedor,
    setOpenVendedor,
    itemsVendedor,
    setItemsVendedor,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    clientesFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarCliente,
  } = useClientes();

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#fff', placeholder: '#ccc' },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>👥 Clientes</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          placeholder="Buscar por nombre o empresa"
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
          <Text style={styles.botonTexto}>➕ Agregar Cliente</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>

          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Nombre Contacto *"
                value={form.nombre_contacto}
                onChangeText={(text) => handleChange('nombre_contacto', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Empresa *"
                value={form.empresa}
                onChangeText={(text) => handleChange('empresa', text)}
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
                label="Correo *"
                value={form.correo}
                onChangeText={(text) => handleChange('correo', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Teléfono *"
                value={form.telefono}
                onChangeText={(text) => handleChange('telefono', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.col2}>
              <PaperInput
                label="Dirección"
                value={form.direccion}
                onChangeText={(text) => handleChange('direccion', text)}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
              />
            </View>
            <View style={styles.col2}>
              <PaperInput
                label="Días Crédito"
                value={form.dias_credito === '0' ? '' : form.dias_credito}
                onChangeText={(text) => handleChange('dias_credito', text)}
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
              <Text style={styles.label}>Estado *</Text>
              <DropDownPicker
                open={openEstado}
                value={form.estado}
                items={itemsEstado}
                setOpen={setOpenEstado}
                setValue={(callback) =>
                  setForm((prev) => ({ ...prev, estado: callback(prev.estado) }))
                }
                setItems={setItemsEstado}
                placeholder="Seleccionar estado"
                style={{
                  backgroundColor: '#1e293b',
                  borderColor: '#3b82f6',
                  marginBottom: 12,
                }}
                dropDownContainerStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#3b82f6',
                }}
                textStyle={{ color: '#fff' }}
                placeholderStyle={{ color: '#ccc' }}
                disabled={cargando}
              />
            </View>

            <View style={styles.col2}>
              <Text style={styles.label}>Vendedor</Text>
              <DropDownPicker
                open={openVendedor}
                value={form.vendedor_id}
                items={itemsVendedor}
                setOpen={setOpenVendedor}
                setValue={(callback) =>
                  setForm((prev) => ({ ...prev, vendedor_id: callback(prev.vendedor_id) }))
                }
                setItems={setItemsVendedor}
                placeholder="Sin vendedor"
                style={{
                  backgroundColor: '#1e293b',
                  borderColor: '#3b82f6',
                  marginBottom: 12,
                }}
                dropDownContainerStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#3b82f6',
                }}
                textStyle={{ color: '#fff' }}
                placeholderStyle={{ color: '#ccc' }}
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
        {clientesFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados'}
            </Text>
          </View>
        ) : (
          clientesFiltrados.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.nombre}>{c.empresa || '-'}</Text>
              <Text style={styles.info}>👤 Contacto: {c.nombre_contacto || '-'}</Text>
              <Text style={styles.info}>📧 Correo: {c.correo || '-'}</Text>
              <Text style={styles.info}>📱 Teléfono: {c.telefono || '-'}</Text>
              <Text style={styles.info}>📍 Dirección: {c.direccion || '-'}</Text>
              <Text style={styles.info}>💳 Días Crédito: {c.dias_credito || 0}</Text>
              <Text style={styles.info}>📊 Estado: {c.estado || '-'}</Text>
              <Text style={styles.info}>👨‍💼 Vendedor: {c.vendedores?.nombre || '-'}</Text>
              <View style={styles.botonesCard}>
                <TouchableOpacity
                  onPress={() => editarCliente(c)}
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
