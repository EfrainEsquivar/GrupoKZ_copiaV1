import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useCelofán = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    material: 'Celofán',
    presentacion: '',
    tipo: '',
    ancho_cm: '',
    largo_cm: '',
    micraje: '',
    nombre: '',
  });

  const presentaciones = ['Bobina', 'Bolsa'];
  const tipos = ['Negra', 'Semi Natural', 'Virgen', 'Color'];

  const generarNombre = (formData) => {
    const { presentacion, tipo, ancho_cm, largo_cm, micraje } = formData;
    const anchoNum = Number(ancho_cm) || 0;
    const largoNum = Number(largo_cm) || 0;
    const micrajeNum = Number(micraje) || 0;

    if (presentacion && tipo && micrajeNum > 0) {
      if (presentacion === 'Bobina' && largoNum === 0) {
        return `${formData.material} ${presentacion} ${tipo} ${anchoNum}cm (${micrajeNum})`;
      } else if (anchoNum > 0 && largoNum > 0) {
        return `${formData.material} ${presentacion} ${tipo} ${anchoNum}x${largoNum} (${micrajeNum})`;
      }
    }
    return formData.nombre || `${formData.material} ${presentacion || ''} ${tipo || ''}`;
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nombre: generarNombre(prev),
    }));
  }, [form.presentacion, form.tipo, form.ancho_cm, form.largo_cm, form.micraje]);

  const fetchProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('material', 'Celofán')
        .order('nombre', { ascending: true });

      if (error) throw error;

      setProductos(data || []);
    } catch (error) {
      console.error('Error en fetchProductos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos de celofán: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.material === 'Celofán' &&
      (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.tipo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => {
      const newForm = { ...prev, [campo]: valor };
      return {
        ...newForm,
        nombre: generarNombre(newForm),
      };
    });
  };

  const resetForm = () => {
    setForm({
      id: null,
      material: 'Celofán',
      presentacion: '',
      tipo: '',
      ancho_cm: '',
      largo_cm: '',
      micraje: '',
      nombre: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { nombre, presentacion, tipo, ancho_cm, largo_cm, micraje, id } = form;

    if (!nombre.trim() || !presentacion || !tipo || !micraje) {
      return Alert.alert('Campos requeridos', 'Nombre, presentación, tipo y micraje son obligatorios.');
    }

    const anchoNum = Number(ancho_cm) || null;
    const largoNum = Number(largo_cm) || null;
    const micrajeNum = Number(micraje);

    if (anchoNum !== null && (isNaN(anchoNum) || anchoNum <= 0)) {
      return Alert.alert('Error', 'El ancho debe ser un número mayor a 0 o dejarlo en blanco.');
    }
    if (largoNum !== null && (isNaN(largoNum) || largoNum <= 0)) {
      return Alert.alert('Error', 'El largo debe ser un número mayor a 0 o dejarlo en blanco (excepto para Bobina).');
    }
    if (isNaN(micrajeNum) || micrajeNum <= 0) {
      return Alert.alert('Error', 'El micraje debe ser un número mayor a 0.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        material: 'Celofán',
        presentacion,
        tipo,
        ancho_cm: anchoNum,
        largo_cm: largoNum,
        micraje: micrajeNum,
        nombre: nombre.trim(),
      };

      const { error } = id
        ? await supabase.from('productos').update(dataEnviar).eq('id', id)
        : await supabase.from('productos').insert([dataEnviar]);

      if (error) throw error;

      Alert.alert('Éxito', id ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'No se pudo guardar el producto: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este producto? Esto puede afectar pedidos o movimientos asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('productos').delete().eq('id', id);

              if (error) throw error;

              Alert.alert('Éxito', 'Producto eliminado correctamente');
              fetchProductos();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto: ' + error.message);
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
      if (productosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay productos de celofán para exportar.');
        return;
      }
      const datos = productosFiltrados.map((p) => ({
        Nombre: p.nombre,
        Presentación: p.presentacion,
        Tipo: p.tipo,
        'Ancho (cm)': p.ancho_cm || 'N/A',
        'Largo (cm)': p.largo_cm || 'N/A',
        'Micraje (µm)': p.micraje,
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Celofán');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'celofán.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel: ' + error.message);
    } finally {
      setCargandoExportar(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setCargandoExportar(true);
      if (productosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay productos de celofán para exportar.');
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
            <h1>Productos de Celofán</h1>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Presentación</th>
                  <th>Tipo</th>
                  <th>Ancho (cm)</th>
                  <th>Largo (cm)</th>
                  <th>Micraje (µm)</th>
                </tr>
              </thead>
              <tbody>
      `;
      productosFiltrados.forEach((p) => {
        html += `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.presentacion}</td>
            <td>${p.tipo}</td>
            <td>${p.ancho_cm || 'N/A'}</td>
            <td>${p.largo_cm || 'N/A'}</td>
            <td>${p.micraje}</td>
          </tr>
        `;
      });
      html += `
              </tbody>
            </table>
            <div class="total">Total de productos: ${productosFiltrados.length}</div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF: ' + error.message);
    } finally {
      setCargandoExportar(false);
    }
  };

  const editarProducto = (producto) => {
    if (producto.material !== 'Celofán') {
      Alert.alert('Error', 'Este producto no es de Celofán.');
      return;
    }
    setForm({
      id: producto.id,
      material: 'Celofán',
      presentacion: producto.presentacion,
      tipo: producto.tipo,
      ancho_cm: producto.ancho_cm ? producto.ancho_cm.toString() : '',
      largo_cm: producto.largo_cm ? producto.largo_cm.toString() : '',
      micraje: producto.micraje.toString(),
      nombre: producto.nombre,
    });
    setMostrarFormulario(true);
  };

  return {
    productos,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    presentaciones,
    tipos,
    generarNombre,
    productosFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarProducto,
  };
};
