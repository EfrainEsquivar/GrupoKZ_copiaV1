// app/pages/AlmacenCelofan.jsx
```javascript
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export default function AlmacenCelofanMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [producciones, setProducciones] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString(),
    producto_id: '',
    millares: '0',
    movimiento: '',
    produccion_id: '',
    entrega_id: '',
  });

  const movimientosTipos = ['entrada', 'salida'];

  useEffect(() => {
    fetchMovimientos();
    fetchProductos();
    fetchProducciones();
    fetchEntregas();
  }, []);

  const fetchMovimientos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('almacen_celofan_movimientos')
        .select('*, productos(nombre, material), produccion_celofan(fecha, productos!inner(nombre)), entregas(fecha_entrega, pedidos_id)')
        .order('fecha', { ascending: false });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los movimientos de almacén de celofán');
        console.error('Error fetching almacen_celofan_movimientos:', error);
        return;
      }

      setMovimientos(data || []);
    } catch (error) {
      console.error('Error en fetchMovimientos:', error);
      Alert.alert('Error', 'Error inesperado al cargar movimientos');
    } finally {
      setCargando(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, material')
        .eq('material', 'Celofán')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.error('Error en fetchProductos:', error);
      Alert.alert('Error', 'Error inesperado al cargar productos');
    }
  };

  const fetchProducciones = async () => {
    try {
      const { data, error } = await supabase
        .from('produccion_celofan')
        .select('id, fecha, productos!inner(nombre)')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching produccion_celofan:', error);
        Alert.alert('Error', 'No se pudieron cargar las producciones');
        return;
      }

      setProducciones(data || []);
    } catch (error) {
      console.error('Error en fetchProducciones:', error);
      Alert.alert('Error', 'Error inesperado al cargar producciones');
    }
  };

  const fetchEntregas = async () => {
    try {
      const { data, error } = await supabase
        .from('entregas')
        .select('id, fecha_entrega, pedidos_id')
        .order('fecha_entrega', { ascending: false, nullsLast: true });

      if (error) {
        console.error('Error fetching entregas:', error);
        Alert.alert('Error', 'No se pudieron cargar las entregas');
        return;
      }

      setEntregas(data || []);
    } catch (error) {
      console.error('Error en fetchEntregas:', error);
      Alert.alert('Error', 'Error inesperado al cargar entregas');
    }
  };

  const movimientosFiltrados = movimientos.filter(
    (m) =>
      (m.productos?.nombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (m.fecha ? new Date(m.fecha).toLocaleString('es-ES') : '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: new Date().toISOString(),
      producto_id: '',
      millares: '0',
      movimiento: '',
      produccion_id: '',
      entrega_id: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, producto_id, millares, movimiento, produccion_id, entrega_id, id } = form;

    if (!fecha || !producto_id || !movimiento) {
      return Alert.alert('Campos requeridos', 'Fecha, producto y tipo de movimiento son obligatorios.');
    }

    const millaresNum = Number(millares);
    if (isNaN(millaresNum) || millaresNum < 0) {
      return Alert.alert('Error', 'Los millares deben ser un número mayor o igual a 0.');
    }

    if (movimiento === 'entrada' && !produccion_id) {
      return Alert.alert('Error', 'Selecciona una producción para entradas.');
    }

    if (movimiento === 'salida' && !entrega_id) {
      return Alert.alert('Error', 'Selecciona una entrega para salidas.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha: new Date(fecha).toISOString(),
        producto_id: Number(producto_id),
        millares: millaresNum,
        movimiento,
        produccion_id: movimiento === 'entrada' ? Number(produccion_id) : null,
        entrega_id: movimiento === 'salida' ? Number(entrega_id) : null,
      };

      const { error } = id
        ? await supabase.from('almacen_celofan_movimientos').update(dataEnviar).eq('id', id)
        : await supabase.from('almacen_celofan_movimientos').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', `No se pudo guardar el movimiento: ${error.message}`);
        console.error('Error saving almacen_celofan_movimientos:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Movimiento actualizado correctamente' : 'Movimiento creado correctamente');
      resetForm();
      fetchMovimientos();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar el movimiento.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este movimiento? Esto puede afectar el inventario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('almacen_celofan_movimientos').delete().eq('id', id);
              if (error) {
                Alert.alert('Error', `No se pudo eliminar el movimiento: ${error.message}`);
                console.error('Error deleting almacen_celofan_movimientos:', error);
                return;
              }
              Alert.alert('Éxito', 'Movimiento eliminado correctamente');
              fetchMovimientos();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar el movimiento.');
            } finally {
              setCargando(false);
            }
          },
        },
      ]
    );
  };

  const exportarExcel = async () => {
    try {
      setCargandoExportar(true);
      if (movimientosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos de almacén de celofán para exportar.');
        return;
      }

      const datos = movimientosFiltrados.map((m) => ({
        Fecha: m.fecha
          ? new Date(m.fecha).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
        Producto: m.productos?.nombre || '-',
        Millares: m.millares || 0,
        Movimiento: m.movimiento ? m.movimiento.charAt(0).toUpperCase() + m.movimiento.slice(1) : '-',
        Producción: m.produccion_celofan?.fecha
          ? new Date(m.produccion_celofan.fecha).toLocaleDateString('es-ES')
          : '-',
        Entrega: m.entregas?.fecha_entrega
          ? new Date(m.entregas.fecha_entrega).toLocaleDateString('es-ES')
          : '-',
        Pedido: m.entregas?.pedidos_id || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AlmacenCelofan');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'almacen_celofan.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel.');
    } finally {
      setCargandoExportar(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setCargandoExportar(true);
      if (movimientosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos de almacén de celofán para exportar.');
        return;
      }

      let html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Movimientos de Almacén de Celofán</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Millares</th>
                  <th>Movimiento</th>
                  <th>Producción</th>
                  <th>Entrega</th>
                  <th>Pedido</th>
                </tr>
              </thead>
              <tbody>
      `;

      movimientosFiltrados.forEach((m) => {
        html += `
          <tr>
            <td>${
              m.fecha
                ? new Date(m.fecha).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'
            }</td>
            <td>${m.productos?.nombre || '-'}</td>
            <td>${m.millares || 0}</td>
            <td>${m.movimiento ? m.movimiento.charAt(0).toUpperCase() + m.movimiento.slice(1) : '-'}</td>
            <td>${
              m.produccion_celofan?.fecha
                ? new Date(m.produccion_celofan.fecha).toLocaleDateString('es-ES')
                : '-'
            }</td>
            <td>${
              m.entregas?.fecha_entrega
                ? new Date(m.entregas.fecha_entrega).toLocaleDateString('es-ES')
                : '-'
            }</td>
            <td>${m.entregas?.pedidos_id || '-'}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de movimientos: ${movimientosFiltrados.length}</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF.');
    } finally {
      setCargandoExportar(false);
    }
  };

  const editarMovimiento = (movimiento) => {
    setForm({
      id: movimiento.id,
      fecha: movimiento.fecha || new Date().toISOString(),
      producto_id: movimiento.producto_id ? movimiento.producto_id.toString() : '',
      millares: movimiento.millares ? movimiento.millares.toString() : '0',
      movimiento: movimiento.movimiento || '',
      produccion_id: movimiento.produccion_id ? movimiento.produccion_id.toString() : '',
      entrega_id: movimiento.entrega_id ? movimiento.entrega_id.toString() : '',
    });
    setMostrarFormulario(true);
  };

  const inputTheme = {
    colors: { primary: '#3b82f6', text: '#fff', placeholder: '#ccc' },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>📦 Almacén de Celofán</Text>
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
                value={
                  form.fecha
                    ? new Date(form.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                }
                onChangeText={(text) => {
                  try {
                    handleChange('fecha', text ? new Date(text).toISOString() : new Date().toISOString());
                  } catch {
                    handleChange('fecha', new Date().toISOString());
                  }
                }}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
                placeholder="DD/MM/YYYY HH:mm"
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
                label="Millares *"
                value={form.millares === '0' ? '' : form.millares}
                onChangeText={(text) => handleChange('millares', text)}
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
                      label={m.charAt(0).toUpperCase() + m.slice(1)}
                      value={m}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          {form.movimiento === 'entrada' && (
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
                          label={`${new Date(p.fecha).toLocaleDateString('es-ES')} - ${p.productos?.nombre || ''}`}
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
          {form.movimiento === 'salida' && (
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
                          label={
                            e.fecha_entrega
                              ? `${new Date(e.fecha_entrega).toLocaleDateString('es-ES')} ${e.pedidos_id ? `(Pedido ${e.pedidos_id})` : ''}`
                              : `Entrega ID ${e.id} (Sin fecha)`
                          }
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
              {busqueda ? 'No se encontraron movimientos con esa búsqueda' : 'No hay movimientos de almacén de celofán registrados'}
            </Text>
          </View>
        ) : (
          movimientosFiltrados.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.nombre}>{m.productos?.nombre || '-'}</Text>
              <Text style={styles.info}>
                📅 Fecha:{' '}
                {m.fecha
                  ? new Date(m.fecha).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </Text>
              <Text style={styles.info}>📦 Millares: {m.millares || '-'}</Text>
              <Text style={styles.info}>
                ↔️ Movimiento: {m.movimiento ? m.movimiento.charAt(0).toUpperCase() + m.movimiento.slice(1) : '-'}
              </Text>
              <Text style={styles.info}>
                🏭 Producción:{' '}
                {m.produccion_celofan?.fecha
                  ? new Date(m.produccion_celofan.fecha).toLocaleDateString('es-ES')
                  : '-'}
              </Text>
              <Text style={styles.info}>
                🚚 Entrega:{' '}
                {m.entregas?.fecha_entrega
                  ? `${new Date(m.entregas.fecha_entrega).toLocaleDateString('es-ES')} ${m.entregas.pedidos_id ? `(Pedido ${m.entregas.pedidos_id})` : ''}`
                  : '-'}
              </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  buscador: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  inputText: { color: '#fff', flex: 1, paddingVertical: 10, marginLeft: 6 },
  botoneraDerecha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  botonAgregar: {
    backgroundColor: '#0bab64',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnExportarExcel: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  btnExportarPDF: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  btnEliminar: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnEditar: {
    backgroundColor: '#eab308',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  formulario: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    maxWidth: Dimensions.get('window').width > 900 ? 900 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  formTitulo: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  botonesForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  btnGuardar: {
    backgroundColor: '#3b82f6',
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelar: {
    backgroundColor: '#ef4444',
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  lista: { marginTop: 10 },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  info: { color: '#cbd5e1', marginTop: 4 },
  botonesCard: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  input: {
    backgroundColor: '#1e293b',
    marginBottom: 12,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  col2: {
    flex: 1,
    minWidth: '45%',
  },
  pickerContainer: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  picker: {
    color: '#fff',
    height: Platform.OS === 'web' ? 40 : 50,
    backgroundColor: '#1e293b',
  },
  pickerItem: {
    color: '#ffffff',
    backgroundColor: '#1e293b',
    fontSize: 16,
  },
  pickerItemPlaceholder: {
    color: '#cccccc',
    backgroundColor: '#1e293b',
    fontSize: 16,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
});
```
