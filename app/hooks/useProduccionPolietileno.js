import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useProduccionPolietileno = () => {
  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    turno: '',
    maquina: '',
    producto_id: '',
    kilos: '0',
    operador: '',
  });

  const turnos = ['Matutino', 'Vespertino', 'Nocturno'];

  useEffect(() => {
    fetchProducciones();
    fetchProductos();
  }, []);

  const fetchProducciones = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('produccion_polietileno')
        .select('*, productos(nombre)')
        .order('fecha', { ascending: false });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las producciones de polietileno');
        console.error('Error fetching produccion_polietileno:', error);
        return;
      }

      setProducciones(data || []);
      if (!data || data.length === 0) {
        Alert.alert('Advertencia', 'No hay producciones de polietileno registradas.');
      }
    } catch (error) {
      console.error('Error en fetchProducciones:', error);
      Alert.alert('Error', 'Error inesperado al cargar producciones');
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
        Alert.alert('Error', 'No se pudieron cargar los productos de polietileno');
        return;
      }

      setProductos(data || []);
      if (!data || data.length === 0) {
        Alert.alert('Advertencia', 'No hay productos de polietileno registrados.');
      }
    } catch (error) {
      console.error('Error en fetchProductos:', error);
      Alert.alert('Error', 'Error inesperado al cargar productos');
    }
  };

  const produccionesFiltradas = producciones.filter(
    (p) =>
      p.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.fecha?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: new Date().toISOString().split('T')[0],
      turno: '',
      maquina: '',
      producto_id: '',
      kilos: '0',
      operador: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, turno, maquina, producto_id, kilos, operador, id } = form;

    if (!fecha || !turno || !maquina.trim() || !producto_id || !operador.trim()) {
      return Alert.alert('Campos requeridos', 'Fecha, turno, máquina, producto y operador son obligatorios.');
    }

    const kilosNum = Number(kilos);
    if (isNaN(kilosNum) || kilosNum <= 0) {
      return Alert.alert('Error', 'Los kilos deben ser un número mayor a 0.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha,
        turno,
        maquina: maquina.trim(),
        producto_id,
        kilos: kilosNum,
        operador: operador.trim(),
      };

      const { error } = id
        ? await supabase.from('produccion_polietileno').update(dataEnviar).eq('id', id)
        : await supabase.from('produccion_polietileno').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar la producción.');
        console.error('Error saving produccion_polietileno:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Producción actualizada correctamente' : 'Producción creada correctamente');
      resetForm();
      fetchProducciones();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar la producción.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta producción? Esto puede afectar movimientos de almacén asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('produccion_polietileno').delete().eq('id', id);

              if (error) {
                Alert.alert('Error', 'No se pudo eliminar la producción.');
                console.error('Error deleting produccion_polietileno:', error);
                return;
              }

              Alert.alert('Éxito', 'Producción eliminada correctamente');
              fetchProducciones();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar la producción.');
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

      if (produccionesFiltradas.length === 0) {
        Alert.alert('Sin datos', 'No hay producciones de polietileno para exportar.');
        return;
      }

      const datos = produccionesFiltradas.map((p) => ({
        Fecha: p.fecha,
        Turno: p.turno,
        Máquina: p.maquina,
        Producto: p.productos?.nombre || 'N/A',
        Kilos: p.kilos,
        Operador: p.operador,
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ProduccionPolietileno');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'produccion_polietileno.xlsx';

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

      if (produccionesFiltradas.length === 0) {
        Alert.alert('Sin datos', 'No hay producciones de polietileno para exportar.');
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
            <h1>Producción de Polietileno</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Máquina</th>
                  <th>Producto</th>
                  <th>Kilos</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody>
      `;

      produccionesFiltradas.forEach((p) => {
        html += `
          <tr>
            <td>${p.fecha || '-'}</td>
            <td>${p.turno || '-'}</td>
            <td>${p.maquina || '-'}</td>
            <td>${p.productos?.nombre || 'N/A'}</td>
            <td>${p.kilos || '-'}</td>
            <td>${p.operador || '-'}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de producciones: ${produccionesFiltradas.length}</div>
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

  const editarProduccion = (produccion) => {
    setForm({
      id: produccion.id,
      fecha: produccion.fecha,
      turno: produccion.turno,
      maquina: produccion.maquina,
      producto_id: produccion.producto_id.toString(),
      kilos: produccion.kilos.toString(),
      operador: produccion.operador,
    });
    setMostrarFormulario(true);
  };

  return {
    producciones,
    productos,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    turnos,
    produccionesFiltradas,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarProduccion,
  };
};