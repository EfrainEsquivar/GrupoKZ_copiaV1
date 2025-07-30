import { useEffect, useState } from 'react';
import {
  Alert,
  Picker,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase'; // ✅ solo un nivel


export default function DetalleVenta() {
  const [detalles, setDetalles] = useState([]);
  const [notas, setNotas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    id: null,
    nota_venta_id: '',
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    subtotal: '',
  });
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    const { data: notasData } = await supabase.from('notas_venta').select('id, folio');
    const { data: productosData } = await supabase.from('productos').select('id, nombre');
    const { data: detallesData } = await supabase
      .from('detalle_venta')
      .select('*')
      .order('id', { ascending: false });

    setNotas(notasData || []);
    setProductos(productosData || []);
    setDetalles(detallesData || []);
  };

  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };

    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = parseFloat(updatedForm.cantidad) || 0;
      const precio = parseFloat(updatedForm.precio_unitario) || 0;
      updatedForm.subtotal = (cantidad * precio).toFixed(2);
    }

    setForm(updatedForm);
  };

  const resetForm = () => {
    setForm({
      id: null,
      nota_venta_id: '',
      producto_id: '',
      cantidad: '',
      precio_unitario: '',
      subtotal: '',
    });
    setEditando(false);
  };

  const handleGuardar = async () => {
    const payload = {
      nota_venta_id: parseInt(form.nota_venta_id),
      producto_id: parseInt(form.producto_id),
      cantidad: parseFloat(form.cantidad),
      precio_unitario: parseFloat(form.precio_unitario),
      subtotal: parseFloat(form.subtotal),
    };

    let error;
    if (form.id) {
      ({ error } = await supabase.from('detalle_venta').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('detalle_venta').insert([payload]));
    }

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Éxito', form.id ? 'Detalle actualizado' : 'Detalle agregado');
      resetForm();
      fetchDatos();
    }
  };

  const handleEditar = (detalle) => {
    setForm({ ...detalle });
    setEditando(true);
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('detalle_venta').delete().eq('id', id);
    if (!error) fetchDatos();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalle de Nota de Venta</Text>

      <Text style={styles.label}>Nota de Venta</Text>
      <Picker
        selectedValue={form.nota_venta_id}
        onValueChange={(value) => handleChange('nota_venta_id', value)}
        style={styles.input}
      >
        <Picker.Item label="Selecciona una nota" value="" />
        {notas.map((nota) => (
          <Picker.Item key={nota.id} label={`#${nota.folio}`} value={nota.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Producto</Text>
      <Picker
        selectedValue={form.producto_id}
        onValueChange={(value) => handleChange('producto_id', value)}
        style={styles.input}
      >
        <Picker.Item label="Selecciona un producto" value="" />
        {productos.map((prod) => (
          <Picker.Item key={prod.id} label={prod.nombre} value={prod.id} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        keyboardType="numeric"
        value={form.cantidad}
        onChangeText={(text) => handleChange('cantidad', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Precio Unitario"
        keyboardType="numeric"
        value={form.precio_unitario}
        onChangeText={(text) => handleChange('precio_unitario', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Subtotal"
        value={form.subtotal}
        editable={false}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
        <Text style={styles.saveButtonText}>{editando ? 'Actualizar' : 'Agregar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Detalles guardados:</Text>
      {detalles.map((d) => (
        <View key={d.id} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text>Nota: #{d.nota_venta_id} | Producto: {d.producto_id}</Text>
            <Text>Cantidad: {d.cantidad} | Subtotal: ${d.subtotal}</Text>
          </View>
          <View style={styles.cardButtons}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditar(d)}>
              <Text style={styles.buttonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleEliminar(d.id)}>
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: { color: 'white', fontWeight: 'bold' },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#facc15',
    padding: 6,
    borderRadius: 6,
    marginRight: 4,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
