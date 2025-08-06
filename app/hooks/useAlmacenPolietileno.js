import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useAlmacenPolietileno = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [producciones, setProducciones] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    producto_id: '',
    kilos: '0',
    movimiento: '',
    produccion_id: '',
    entrega_id: '',
  });

  const movimientosTipos = ['Entrada', 'Salida'];

  useEffect(() => {
    fetchMovimientos();
    fetchProductos();
    fetchProducciones();
    fetchEntregas();
  }, []);

  const fetchMovimientos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('almacen_polietileno_movimientos')
        .select('*, productos(nombre), produccion_polietileno(fecha), entregas(fecha_entrega)')
        .order('fecha', { ascending: false });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los movimientos de almacén de polietileno');
        console.error('Error fetching almacen_polietileno_movimientos:', error);
        return;
      }

      setMovimientos(data || []);
    } catch (error) {
      console.error('Error en fetchMovimientos:', error);
      Alert.alert('Error', 'Error inesperado al cargar movimientos');
    } finally {
      setCargando(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre')
        .eq('material', 'Polietileno')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching productos:', error);
        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.error('Error en fetchProductos:', error);
    }
  };

  const fetchProducciones = async () => {
    try {
      const { data, error } = await supabase
        .from('produccion_polietileno')
        .select('id, fecha')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching produccion_polietileno:', error);
        return;
      }

      setProducciones(data || []);
    } catch (error) {
      console.error('Error en fetchProducciones:', error);
    }
  };

  const fetchEntregas = async () => {
    try {
      const { data, error } = await supabase
        .from('entregas')
        .select('id, fecha_entrega')
        .order('fecha_entrega', { ascending: false });

      if (error) {
        console.error('Error fetching entregas:', error);
        return;
      }

      setEntregas(data || []);
    } catch (error) {
      console.error('Error en fetchEntregas:', error);
    }
  };

  const movimientosFiltrados = movimientos.filter(
    (m) =>
      m.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.fecha?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: new Date().toISOString().split('T')[0],
      producto_id: '',
      kilos: '0',
      movimiento: '',
      produccion_id: '',
      entrega_id: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, producto_id, kilos, movimiento, produccion_id, entrega_id, id } = form;

    if (!fecha || !producto_id || !movimiento) {
      return Alert.alert('Campos requeridos', 'Fecha, producto y tipo de movimiento son obligatorios.');
    }

    const kilosNum = Number(kilos);

    if (isNaN(kilosNum) || kilosNum <= 0) {
      return Alert.alert('Error', 'Los kilos deben ser un número mayor a 0.');
    }

    if ((movimiento === 'Entrada' && !produccion_id) || (movimiento === 'Salida' && !entrega_id)) {
      return Alert.alert('Error', movimiento === 'Entrada' 
        ? 'Selecciona una producción para entradas.' 
        : 'Selecciona una entrega para salidas.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha,
        producto_id,
        kilos: kilosNum,
        movimiento,
        produccion_id: movimiento === 'Entrada' ? produccion_id : null,
        entrega_id: movimiento === 'Salida' ? entrega_id : null,
      };

      const { error } = id
        ? await supabase.from('almacen_polietileno_movimientos').update(dataEnviar).eq('id', id)
        : await supabase.from('almacen_polietileno_movimientos').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar el movimiento.');
        console.error('Error saving almacen_polietileno_movimientos:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Movimiento actualizado correctamente' : 'Movimiento creado correctamente');
      resetForm();
      fetchMovimientos();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar el movimiento.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este movimiento? Esto puede afectar el inventario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('almacen_polietileno_movimientos').delete().eq('id', id);

              if (error) {
                Alert.alert('Error', 'No se pudo eliminar el movimiento.');
                console.error('Error deleting almacen_polietileno_movimientos:', error);
                return;
              }

              Alert.alert('Éxito', 'Movimiento eliminado correctamente');
              fetchMovimientos();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar el movimiento.');
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

      if (movimientosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos de almacén de polietileno para exportar.');
        return;
      }

      const datos = movimientosFiltrados.map((m) => ({
        Fecha: m.fecha,
        Producto: m.productos?.nombre || '-',
        Kilos: m.kilos,
        Movimiento: m.movimiento,
        'Producción': m.produccion_polietileno?.fecha || '-',
        'Entrega': m.entregas?.fecha_entrega || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AlmacenPolietileno');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'almacen_polietileno.xlsx';

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

      if (movimientosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos de almacén de polietileno para exportar.');
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
            <h1>Movimientos de Almacén de Polietileno</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Kilos</th>
                  <th>Movimiento</th>
                  <th>Producción</th>
                  <th>Entrega</th>
                </tr>
              </thead>
              <tbody>
      `;

      movimientosFiltrados.forEach((m) => {
        html += `
          <tr>
            <td>${m.fecha || '-'}</td>
            <td>${m.productos?.nombre || '-'}</td>
            <td>${m.kilos || '-'}</td>
            <td>${m.movimiento || '-'}</td>
            <td>${m.produccion_polietileno?.fecha || '-'}</td>
            <td>${m.entregas?.fecha_entrega || '-'}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de movimientos: ${movimientosFiltrados.length}</div>
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

  const editarMovimiento = (movimiento) => {
    setForm({
      id: movimiento.id,
      fecha: movimiento.fecha,
      producto_id: movimiento.producto_id.toString(),
      kilos: movimiento.kilos.toString(),
      movimiento: movimiento.movimiento,
      produccion_id: movimiento.produccion_id?.toString() || '',
      entrega_id: movimiento.entrega_id?.toString() || '',
    });
    setMostrarFormulario(true);
  };

  return {
    movimientos,
    productos,
    producciones,
    entregas,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    setForm,
    movimientosTipos,
    movimientosFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarMovimiento,
  };
};
