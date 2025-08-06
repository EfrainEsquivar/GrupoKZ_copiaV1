import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export const usePagos = () => {
  const [pagos, setPagos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);

  const [form, setForm] = useState({
    id: null,
    nota_venta_id: '',
    fecha: '',
    importe: '',
    foto_comprobante: ''
  });

  useEffect(() => {
    fetchPagos();
    fetchNotasVenta();
  }, []);

  const fetchPagos = async () => {
    const { data, error } = await supabase.from('pagos').select('*').order('id', { ascending: false });
    if (!error) setPagos(data);
  };

  const fetchNotasVenta = async () => {
    const { data, error } = await supabase.from('notas_venta').select('id, cliente');
    if (!error) setNotas(data);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      nota_venta_id: '',
      fecha: '',
      importe: '',
      foto_comprobante: ''
    });
    setEditando(false);
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    if (!form.nota_venta_id || !form.fecha || !form.importe) {
      Alert.alert('Error', 'Todos los campos obligatorios deben estar completos');
      return;
    }

    const payload = {
      nota_venta_id: parseInt(form.nota_venta_id),
      fecha: form.fecha,
      importe: parseFloat(form.importe),
      foto_comprobante: form.foto_comprobante || null
    };

    let error;
    if (form.id) {
      ({ error } = await supabase.from('pagos').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('pagos').insert([payload]));
    }

    if (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } else {
      Alert.alert('Éxito', form.id ? 'Pago actualizado' : 'Pago registrado');
      resetForm();
      fetchPagos();
    }
  };

  const handleEditar = (item) => {
    setForm({
      ...item,
      nota_venta_id: item.nota_venta_id?.toString() ?? ''
    });
    setEditando(true);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (!error) fetchPagos();
  };

  return {
    pagos,
    notas,
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