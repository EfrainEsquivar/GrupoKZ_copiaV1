import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

const MATERIAL_CELOFAN = 'Celofán';

const useCelofan = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    existencia: '',
    precio: '',
    unidad: '',
    material: MATERIAL_CELOFAN,
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('material', MATERIAL_CELOFAN)
      .order('nombre', { ascending: true });

    if (error) {
      Alert.alert('Error al obtener productos', error.message);
    } else {
      setProductos(data);
    }
    setLoading(false);
  };

  const agregarProducto = async () => {
    const { error } = await supabase.from('productos').insert([form]);
    if (error) {
      Alert.alert('Error al agregar producto', error.message);
    } else {
      fetchProductos();
      resetForm();
    }
  };

  const editarProducto = async (producto) => {
    setForm({
      nombre: producto.nombre,
      existencia: producto.existencia.toString(),
      precio: producto.precio.toString(),
      unidad: producto.unidad,
      material: MATERIAL_CELOFAN,
    });
    setEditingId(producto.id);
  };

  const actualizarProducto = async () => {
    const { error } = await supabase
      .from('productos')
      .update(form)
      .eq('id', editingId);
    if (error) {
      Alert.alert('Error al actualizar producto', error.message);
    } else {
      fetchProductos();
      resetForm();
      setEditingId(null);
    }
  };

  const eliminarProducto = async (id) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      Alert.alert('Error al eliminar producto', error.message);
    } else {
      fetchProductos();
    }
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      existencia: '',
      precio: '',
      unidad: '',
      material: MATERIAL_CELOFAN,
    });
    setEditingId(null);
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.material === MATERIAL_CELOFAN &&
      p.nombre &&
      p.existencia !== null &&
      p.precio !== null &&
      p.unidad
  );

  return {
    productos: productosFiltrados,
    form,
    setForm,
    agregarProducto,
    editarProducto,
    actualizarProducto,
    eliminarProducto,
    resetForm,
    editingId,
    loading,
  };
};

export default useCelofan;
