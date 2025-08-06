import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export const useEntregas = () => {
  const [entregas, setEntregas] = useState([]);
  const [form, setForm] = useState({
    id: null,
    nota_venta_id: '',
    producto_id: '',
    cantidad: '',
    unidades: '',
    fecha_entrega: '',
  });
  const [editando, setEditando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    fetchEntregas();
  }, []);

  const fetchEntregas = async () => {
    const { data, error } = await supabase.from('entregas').select('*').order('id', { ascending: false });
    if (!error) setEntregas(data);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      nota_venta_id: '',
      producto_id: '',
      cantidad: '',
      unidades: '',
      fecha_entrega: '',
    });
    setEditando(false);
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    try {
      const payload = {
        nota_venta_id: parseInt(form.nota_venta_id),
        producto_id: parseInt(form.producto_id),
        cantidad: parseFloat(form.cantidad),
        unidades: form.unidades,
        fecha_entrega: form.fecha_entrega,
      };

      let error;
      if (form.id) {
        ({ error } = await supabase.from('entregas').update(payload).eq('id', form.id));
      } else {
        ({ error } = await supabase.from('entregas').insert([payload]));
      }

      if (error) throw error;

      Alert.alert('Listo', form.id ? 'Entrega actualizada' : 'Entrega agregada');
      resetForm();
      fetchEntregas();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditar = (item) => {
    setForm({ ...item });
    setEditando(true);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    const { error } = await supabase.from('entregas').delete().eq('id', id);
    if (!error) fetchEntregas();
  };

  return {
    entregas,
    form,
    editando,
    mostrarFormulario,
    setMostrarFormulario,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
  };
};