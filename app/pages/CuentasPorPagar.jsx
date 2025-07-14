// app/pages/CuentasPorPagar.jsx
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
} from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export default function CuentasPorPagar() {
  const [cuentas, setCuentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    importe: '0',
    estado: 'Pendiente',
    descripcion: '',
    gasto_id: '',
  });

  const estados = ['Pendiente', 'Pagado'];

  useEffect(() => {
    fetchCuentas();
    fetchGastos();
  }, []);

  const fetchCuentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('cuentas_por_pagar')
        .select('*, gastos(concepto)')
        .order('fecha', { ascending: false });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las cuentas por pagar');
        console.error('Error fetching cuentas_por_pagar:', error);
        return;
      }

      setCuentas(data || []);
    } catch (error) {
      console.error('Error en fetchCuentas:', error);
      Alert.alert('Error', 'Error inesperado al cargar cuentas');
    } finally {
      setCargando(false);
    }
  };

  const fetchGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('id, concepto')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching gastos:', error);
        return;
      }

      setGastos(data || []);
    } catch (error) {
      console.error('Error en fetchGastos:', error);
    }
  };

  const cuentasFiltradas = cuentas.filter(
    (c) =>
      c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.estado.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: new Date().toISOString().split('T')[0],
      proveedor: '',
      importe: '0',
      estado: 'Pendiente',
      descripcion: '',
      gasto_id: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, proveedor, importe, estado, descripcion, gasto_id, id } = form;

    if (!fecha || !proveedor.trim() || !estado) {
      return Alert.alert('Campos requeridos', 'Fecha, proveedor y estado son obligatorios.');
    }

    const importeNum = Number(importe);

    if (isNaN(importeNum) || importeNum <= 0) {
      return Alert.alert('Error', 'El importe debe ser un número mayor a 0.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha,
        proveedor: proveedor.trim(),
        importe: importeNum,
        estado,
        descripcion: descripcion.trim() || null,
        gasto_id: gasto_id || null,
      };

      const { error } = id
        ? await supabase.from('cuentas_por_pagar').update(dataEnviar).eq('id', id)
        : await supabase.from('cuentas_por_pagar').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar la cuenta por pagar.');
        console.error('Error saving cuentas_por_pagar:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Cuenta actualizada correctamente' : 'Cuenta creada correctamente');
      resetForm();
      fetchCuentas();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar la cuenta.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta cuenta por pagar? Esto puede afectar reportes financieros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('cuentas_por_pagar').delete().eq('id', id);

              if (error) {
                Alert.alert('Error', 'No se pudo eliminar la cuenta.');
                console.error('Error deleting cuentas_por_pagar:', error);
                return;
              }

              Alert.alert('Éxito', 'Cuenta eliminada correctamente');
              fetchCuentas();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar la cuenta.');
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

      if (cuentasFiltradas.length === 0) {
        Alert.alert('Sin datos', 'No hay cuentas por pagar para exportar.');
        return;
      }

      const datos = cuentasFiltradas.map((c) => ({
        Fecha: c.fecha,
        Proveedor: c.proveedor,
        Importe: c.importe,
        Estado: c.estado,
        Descripción: c.descripcion || '-',
        Gasto: c.gastos?.concepto || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CuentasPorPagar');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'cuentas_por_pagar.xlsx';

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

      if (cuentasFiltradas.length === 0) {
        Alert.alert('Sin datos', 'No hay cuentas por pagar para exportar.');
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
            <h1>Cuentas por Pagar</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Descripción</th>
                  <th>Gasto</th>
                </tr>
              </thead>
              <tbody>
      `;

      cuentasFiltradas.forEach((c) => {
        html += `
          <tr>
            <td>${c.fecha}</td>
            <td>${c.proveedor}</td>
            <td>${c.importe}</td>
            <td>${c.estado}</td>
            <td>${c.descripcion || '-'}</td>
            <td>${c.gastos?.concepto || '-'}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de cuentas: ${cuentasFiltradas.length}</div>
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

  const editarCuenta = (cuenta) => {
    setForm({
      id: cuenta.id,
      fecha: cuenta.fecha,
      proveedor: cuenta.proveedor,
      importe: cuenta.importe.toString(),
      estado: cuenta.estado,
      descripcion: cuenta.descripcion || '',
      gasto_id: cuenta.gasto_id || '',
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
      <Text style={styles.title}>💸 Cuentas por Pagar</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          placeholder="Buscar por proveedor o estado"
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
          <Text style={styles.botonTexto}>➕ Agregar Cuenta</Text>
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
          <Text style={styles.formTitulo}>{form.id ? 'Editar Cuenta' : 'Nueva Cuenta'}</Text>

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
                value={form.importe === '0' ? '' : form.importe}
                onChangeText={(text) => handleChange('importe', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                theme={inputTheme}
                textColor="#ffffff"
                disabled={cargando}
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
                >
                  <Picker.Item label="Seleccionar estado" value="" />
                  {estados.map((e) => (
                    <Picker.Item key={e} label={e} value={e} />
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
                >
                  <Picker.Item label="Sin gasto" value="" />
                  {gastos.map((g) => (
                    <Picker.Item key={g.id} label={g.concepto} value={g.id} />
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
        {cuentasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron cuentas con esa búsqueda' : 'No hay cuentas por pagar registradas'}
            </Text>
          </View>
        ) : (
          cuentasFiltradas.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.nombre}>{c.proveedor}</Text>
              <Text style={styles.info}>📅 Fecha: {c.fecha}</Text>
              <Text style={styles.info}>💰 Importe: {c.importe}</Text>
              <Text style={styles.info}>📋 Estado: {c.estado}</Text>
              <Text style={styles.info}>📝 Descripción: {c.descripcion || '-'}</Text>
              <Text style={styles.info}>🧾 Gasto: {c.gastos?.concepto || '-'}</Text>
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
    maxWidth: 900,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  picker: {
    color: '#fff',
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