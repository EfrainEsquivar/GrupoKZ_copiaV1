import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export default function NotasVenta() {
  const [notas, setNotas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [busquedaFolio, setBusquedaFolio] = useState('');
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [form, setForm] = useState({
    id: null,
    folio: '',
    fecha: '',
    cliente_id: '',
    pedido: 'Celofán',
    subtotal_importe: '',
    descuento: '',
    subtotal: '',
    iva: '',
    total: '',
    pago_abonado: '',
    pago_pendiente: '',
    estado: 'Pendiente',
    observaciones: '',
  });

  useEffect(() => {
    fetchNotas();
  }, []);

  const fetchNotas = async () => {
    const { data, error } = await supabase.from('notas_venta').select('*').order('id', { ascending: false });
    if (!error) setNotas(data);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      folio: '',
      fecha: '',
      cliente_id: '',
      pedido: 'Celofán',
      subtotal_importe: '',
      descuento: '',
      subtotal: '',
      iva: '',
      total: '',
      pago_abonado: '',
      pago_pendiente: '',
      estado: 'Pendiente',
      observaciones: '',
    });
    setEditando(false);
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    try {
      const payload = {
        folio: form.folio,
        fecha: form.fecha,
        cliente_id: parseInt(form.cliente_id),
        pedido: form.pedido,
        subtotal_importe: parseFloat(form.subtotal_importe),
        descuento: parseFloat(form.descuento),
        subtotal: parseFloat(form.subtotal),
        iva: parseFloat(form.iva),
        total: parseFloat(form.total),
        pago_abonado: parseFloat(form.pago_abonado),
        pago_pendiente: parseFloat(form.pago_pendiente),
        estado: form.estado,
        observaciones: form.observaciones,
      };

      let error;
      if (form.id) {
        ({ error } = await supabase.from('notas_venta').update(payload).eq('id', form.id));
      } else {
        ({ error } = await supabase.from('notas_venta').insert([payload]));
      }

      if (error) throw error;

      Alert.alert('Exito', form.id ? 'Nota actualizada' : 'Nota registrada');
      resetForm();
      fetchNotas();
    } catch (e) {
      Alert.alert('Error', e.message || 'Ocurrió un error al guardar');
    }
  };

  const handleEditar = (nota) => {
    setForm({ ...nota });
    setEditando(true);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('notas_venta').delete().eq('id', id);
    if (!error) fetchNotas();
  };

  const exportarExcel = async () => {
    const datos = notasFiltradas.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NotasVenta');

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'notas_venta.xlsx';
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri);
  };

  const exportarPDF = async () => {
    let html = `<h1>Lista de Notas de Venta</h1><ul>`;
    notasFiltradas.forEach((n) => {
      html += `<li><strong>${n.folio}</strong> - ${n.fecha} - Total: $${n.total}</li>`;
    });
    html += `</ul>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const notasFiltradas = notas.filter((nota) =>
    busquedaFolio === '' || (nota.folio && nota.folio.toLowerCase().includes(busquedaFolio.toLowerCase()))
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 20 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📄 Notas de Venta</Text>
        <View style={styles.botoneraDerecha}>
          <TouchableOpacity style={styles.botonAgregar} onPress={() => { resetForm(); setMostrarFormulario(true); }}>
            <Text style={styles.botonTexto}>➕ Agregar Nota</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportarExcel} style={styles.btnExportarExcel}>
            <Text style={styles.botonTexto}>📊 Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportarPDF} style={styles.btnExportarPDF}>
            <Text style={styles.botonTexto}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mostrarFormulario && (
        <ScrollView style={styles.formulario}>
          {Object.entries(form).map(([key, value]) => {
            if (key === 'fecha') {
              return (
                Platform.OS === 'web' ? (
                  <View key={key} style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#fff', marginBottom: 4 }}>Fecha:</Text>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => handleChange('fecha', e.target.value)}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        borderColor: '#334155',
                        borderWidth: 1,
                        backgroundColor: '#fff',
                        color: '#000',
                        width: '100%',
                      }}
                    />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity key={key} onPress={() => setMostrarPickerFecha(true)}>
                      <TextInput
                        style={styles.input}
                        placeholder="Fecha"
                        placeholderTextColor="#ccc"
                        value={form.fecha}
                        editable={false}
                      />
                    </TouchableOpacity>
                    {mostrarPickerFecha && (
                      <DateTimePicker
                        value={form.fecha ? new Date(form.fecha) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setMostrarPickerFecha(false);
                          if (selectedDate) {
                            const isoString = selectedDate.toISOString().split('T')[0];
                            handleChange('fecha', isoString);
                          }
                        }}
                      />
                    )}
                  </>
                )
              );
            }

            if (key === 'pedido') {
              return (
                <Picker
                  key={key}
                  selectedValue={value}
                  onValueChange={(itemValue) => handleChange(key, itemValue)}
                  style={{ color: 'black', backgroundColor: 'white', marginBottom: 10 }}
                >
                  <Picker.Item label="Celofán" value="Celofán" />
                  <Picker.Item label="Polietileno" value="Polietileno" />
                </Picker>
              );
            }

            if (key === 'id') return null;

            return (
              <TextInput
                key={key}
                style={styles.input}
                placeholder={key}
                placeholderTextColor="#ccc"
                value={String(value)}
                onChangeText={(text) => handleChange(key, text)}
              />
            );
          })}

          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
            <Text style={styles.botonTexto}>{editando ? 'Actualizar' : 'Guardar'} Nota</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancelar} onPress={resetForm}>
            <Text style={styles.botonTexto}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <TextInput
        style={styles.input}
        placeholder="Buscar por folio"
        placeholderTextColor="#ccc"
        value={busquedaFolio}
        onChangeText={setBusquedaFolio}
      />

      <ScrollView style={{ marginTop: 10 }}>
        {notasFiltradas.map((nota) => (
          <View key={nota.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>📎 Folio: {nota.folio}</Text>
              <Text style={styles.info}>📆 Fecha: {nota.fecha}</Text>
              <Text style={styles.info}>💰 Total: ${nota.total} | Estado: {nota.estado}</Text>
            </View>
            <View style={styles.botonesCard}>
              <TouchableOpacity style={styles.btnEditar} onPress={() => handleEditar(nota)}>
                <Text style={styles.botonTexto}>✏️EDITAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnEliminar} onPress={() => handleEliminar(nota.id)}>
                <Text style={styles.botonTexto}>🗑️ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
    color: '#fff',
  },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  botoneraDerecha: {
    flexDirection: 'row',
    gap: 10,
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
  },
  btnExportarPDF: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  formulario: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  btnGuardar: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnCancelar: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
  },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  info: { color: '#cbd5e1', marginTop: 4 },
  botonesCard: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  btnEditar: {
    backgroundColor: '#facc15',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnEliminar: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
