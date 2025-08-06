import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export const useProduccion = () => {
  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);

  const [form, setForm] = useState({
    id: null,
    fecha: '',
    turno: '',
    maquina: '',
    material: '',
    producto_id: '',
    cantidad: '',
  });

  useEffect(() => {
    fetchProduccion();
    fetchProductos();
  }, []);

  const fetchProduccion = async () => {
    const { data, error } = await supabase.from('produccion').select('*').order('id', { ascending: false });
    if (!error) setProducciones(data);
  };

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('id, nombre');
    if (!error) setProductos(data);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: '',
      turno: '',
      maquina: '',
      material: '',
      producto_id: '',
      cantidad: '',
    });
    setEditando(false);
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    if (!form.fecha || !form.turno || !form.material || !form.producto_id || !form.cantidad) {
      Alert.alert('Error', 'Todos los campos obligatorios deben estar completos');
      return;
    }

    const payload = {
      fecha: form.fecha,
      turno: form.turno,
      maquina: form.maquina || null,
      material: form.material,
      producto_id: parseInt(form.producto_id),
      cantidad: parseFloat(form.cantidad),
    };

    let error;
    if (form.id) {
      ({ error } = await supabase.from('produccion').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('produccion').insert([payload]));
    }

    if (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } else {
      Alert.alert('Éxito', form.id ? 'Producción actualizada' : 'Producción registrada');
      resetForm();
      fetchProduccion();
    }
  };

  const handleEditar = (item) => {
    setForm({ ...item, producto_id: item.producto_id?.toString() });
    setEditando(true);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('produccion').delete().eq('id', id);
    if (!error) fetchProduccion();
  };

  return {
    producciones,
    productos,
    mostrarFormulario,
    setMostrarFormulario,
    editando,
    form,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
  };
};