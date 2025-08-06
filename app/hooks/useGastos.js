import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useGastos = () => {
  const [gastos, setGastos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    importe: '',
    categoria: '',
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('gastos')
        .select('*, created_at, updated_at')
        .order('fecha', { ascending: false });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los gastos');
        console.error('Error fetching gastos:', error);
        return;
      }
      setGastos(data || []);
    } catch (error) {
      console.error('Error en fetchGastos:', error);
      Alert.alert('Error', 'Error inesperado al cargar gastos');
    } finally {
      setCargando(false);
    }
  };

  const gastosFiltrados = gastos.filter(
    (g) =>
      g.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (g.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('fecha', formattedDate);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      importe: '',
      categoria: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, concepto, importe, categoria, id } = form;

    if (!fecha || !concepto.trim()) {
      return Alert.alert('Campos requeridos', 'Fecha y concepto son obligatorios.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return Alert.alert('Error', 'La fecha debe estar en formato AAAA-MM-DD.');
    }

    const importeNum = Number(importe);
    if (isNaN(importeNum) || importeNum < 0) {
      return Alert.alert('Error', 'El importe debe ser un número válido mayor o igual a 0.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha,
        concepto: concepto.trim(),
        importe: importeNum,
        categoria: categoria.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabase.from('gastos').update(dataEnviar).eq('id', id)
        : await supabase.from('gastos').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar el gasto.');
        console.error('Error saving gasto:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente');
      resetForm();
      fetchGastos();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar el gasto.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('gastos').delete().eq('id', id);
              if (error) {
                Alert.alert('Error', 'No se pudo eliminar el gasto.');
                console.error('Error deleting gasto:', error);
                return;
              }
              Alert.alert('Éxito', 'Gasto eliminado correctamente');
              fetchGastos();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar el gasto.');
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
      if (gastosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay gastos para exportar.');
        return;
      }
      const datos = gastosFiltrados.map((g) => ({
        Fecha: g.fecha,
        Concepto: g.concepto,
        Importe: g.importe,
        Categoría: g.categoria || 'Sin categoría',
        Creado: formatTimestamp(g.created_at),
        Actualizado: formatTimestamp(g.updated_at),
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'gastos.xlsx';
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
      if (gastosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay gastos para exportar.');
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
            <h1>Lista de Gastos</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Importe</th>
                  <th>Categoría</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
      `;
      gastosFiltrados.forEach((g) => {
        html += `
          <tr>
            <td>${g.fecha}</td>
            <td>${g.concepto}</td>
            <td>${g.importe.toLocaleString('es-CO')}</td>
            <td>${g.categoria || 'Sin categoría'}</td>
            <td>${formatTimestamp(g.created_at)}</td>
            <td>${formatTimestamp(g.updated_at)}</td>
          </tr>
        `;
      });
      html += `
              </tbody>
            </table>
            <div class="total">Total de gastos: ${gastosFiltrados.length}</div>
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

  const editarGasto = (gasto) => {
    setForm({
      id: gasto.id,
      fecha: gasto.fecha,
      concepto: gasto.concepto,
      importe: gasto.importe.toString(),
      categoria: gasto.categoria || '',
    });
    setMostrarFormulario(true);
  };

  return {
    gastos,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    showDatePicker,
    setShowDatePicker,
    form,
    setForm,
    gastosFiltrados,
    handleChange,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarGasto,
    formatTimestamp,
  };
};