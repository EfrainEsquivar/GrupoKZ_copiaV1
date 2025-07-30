import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function DetalleNota() {
  const { id } = useLocalSearchParams(); // nota_id
  const router = useRouter();

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [form, setForm] = useState({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
  });

  const [totalNota, setTotalNota] = useState(0);

  useEffect(() => {
    fetchProductos();
    fetchDetalle();
  }, []);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('id, nombre');
    if (!error) setProductosDisponibles(data);
  };

  const fetchDetalle = async () => {
    const { data, error } = await supabase
      .from('detalle_venta')
      .select('*, producto:producto_id(nombre)')
      .eq('nota_id', id);

    if (!error) {
      setDetalles(data);
      const suma = data.reduce((acc, item) => acc + parseFloat(item.total), 0);
      setTotalNota(suma);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const agregarProducto = async () => {
  const { producto_id, cantidad, precio_unitario } = form;

  if (!producto_id || !cantidad || !precio_unitario) {
    return Alert.alert('Campos requeridos', 'Completa todos los campos');
  }

  const cantidadNum = parseFloat(cantidad);
  const precioNum = parseFloat(precio_unitario);

  if (isNaN(cantidadNum) || isNaN(precioNum)) {
    return Alert.alert('Error', 'Cantidad o precio inválido');
  }

  const total = cantidadNum * precioNum;

  const { error } = await supabase.from('detalle_venta').insert([
    {
      nota_id: parseInt(id),
      producto_id: parseInt(producto_id),
      cantidad: cantidadNum,
      precio_unitario: precioNum,
      total,
    },
  ]);

  if (error) {
    Alert.alert('Error al guardar', error.message);
  } else {
    setForm({ producto_id: '', cantidad: '', precio_unitario: '' });
    fetchDetalle();
  }
};


  const eliminarDetalle = async (detalleId) => {
    const { error } = await supabase.from('detalle_venta').delete().eq('id', detalleId);
    if (!error) fetchDetalle();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧾 Detalle de Nota #{id}</Text>

      {/* FORMULARIO DE AGREGADO */}
      <View style={styles.card}>
        <Text style={styles.label}>📦 Producto</Text>
        <Picker
          selectedValue={form.producto_id}
          onValueChange={(value) => handleChange('producto_id', value)}
        >
          <Picker.Item label="Seleccione un producto" value="" />
          {productosDisponibles.map((p) => (
            <Picker.Item key={p.id} label={p.nombre} value={p.id} />
          ))}
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={form.cantidad}
          onChangeText={(text) => handleChange('cantidad', text)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Precio unitario"
          value={form.precio_unitario}
          onChangeText={(text) => handleChange('precio_unitario', text)}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.saveButton} onPress={agregarProducto}>
          <Text style={styles.saveButtonText}>➕ Agregar producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* LISTA DE PRODUCTOS AGREGADOS */}
      <Text style={styles.subtitle}>📋 Productos agregados</Text>
      {detalles.length === 0 && <Text style={{ color: '#777' }}>Aún no hay productos.</Text>}

      {detalles.map((d) => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.cardTitle}>{d.producto?.nombre}</Text>
          <Text style={styles.cardText}>Cantidad: {d.cantidad}</Text>
          <Text style={styles.cardText}>Precio unitario: ${d.precio_unitario}</Text>
          <Text style={styles.cardText}>Subtotal: ${d.total}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => eliminarDetalle(d.id)}
          >
            <Text style={styles.buttonText}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* TOTAL */}
      <View style={styles.totalBox}>
        <Text style={styles.totalText}>🧮 Total de esta nota: ${totalNota.toFixed(2)}</Text>
      </View>

      {/* BOTÓN VOLVER */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>⬅️ Volver a notas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  label: { fontWeight: '600', marginTop: 10 },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  card: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    marginVertical: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardText: { fontSize: 14, color: '#333' },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 12,
    marginTop: 30,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: { color: 'white', fontWeight: 'bold' },
  totalBox: {
    marginTop: 20,
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalText: { fontWeight: 'bold', fontSize: 16, color: '#0c4a6e' },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
});
