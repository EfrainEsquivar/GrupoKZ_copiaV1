import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

export default function DetalleNotaVenta() {
  const { id } = useLocalSearchParams(); // nota_venta_id
  const nota_venta_id = parseInt(id);
  const [detalle, setDetalle] = useState([]);
  const [form, setForm] = useState({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
  });

  useEffect(() => {
    fetchDetalle();
  }, []);

  const fetchDetalle = async () => {
    const { data, error } = await supabase
      .from('detalle_venta')
      .select(`*, productos(nombre)`)
      .eq('nota_venta_id', nota_venta_id);

    if (error) Alert.alert('Error', error.message);
    else setDetalle(data);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    try {
      const { producto_id, cantidad, precio_unitario } = form;
      const subtotal = parseFloat(cantidad) * parseFloat(precio_unitario);

      const { error } = await supabase.from('detalle_venta').insert([
        {
          nota_venta_id,
          producto_id: parseInt(producto_id),
          cantidad: parseFloat(cantidad),
          precio_unitario: parseFloat(precio_unitario),
          subtotal,
        },
      ]);

      if (error) throw error;
      setForm({ producto_id: '', cantidad: '', precio_unitario: '' });
      fetchDetalle();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('detalle_venta').delete().eq('id', id);
    if (!error) fetchDetalle();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalle de Nota #{nota_venta_id}</Text>

      <TextInput
        placeholder="ID del producto"
        value={form.producto_id}
        onChangeText={(text) => handleChange('producto_id', text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Cantidad"
        value={form.cantidad}
        onChangeText={(text) => handleChange('cantidad', text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Precio unitario"
        value={form.precio_unitario}
        onChangeText={(text) => handleChange('precio_unitario', text)}
        style={styles.input}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Agregar Producto</Text>
      </TouchableOpacity>

      {detalle.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardText}>
            Producto: {item.productos?.nombre || item.producto_id}
          </Text>
          <Text style={styles.cardText}>
            Cantidad: {item.cantidad} - Precio: {item.precio_unitario} - Subtotal: {item.subtotal}
          </Text>
          <TouchableOpacity
            onPress={() => handleEliminar(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.buttonText}>🖑️</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  card: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardText: { fontSize: 14, marginBottom: 4 },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
});
