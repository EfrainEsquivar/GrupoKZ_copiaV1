import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useCuentasPorPagar = () => {
  const [cuentas, setCuentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    importe: '',
    estado: 'Pendiente',
    descripcion: '',
    gasto_id: '',
  });

  const estados = ['Pendiente', 'Pagado'];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  useEffect(() => {
    fetchCuentas();
    fetchGastos();
  }, []);

  const fetchCuentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('cuentas_por_pagar')
        .select('*, gastos(concepto), created_at, updated_at')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setCuentas(data || []);
    } catch (error) {
      console.error('Error en fetchCuentas:', error);
      Alert.alert('Error', 'Error al cargar cuentas por pagar');
    } finally {
      setCargando(false);
    }
  };

  const fetchGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('id, concepto')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setGastos(data || []);
    } catch (error) {
      console.error('Error en fetchGastos:', error);
      Alert.alert('Error', 'Error al cargar gastos');
    }
  };

  const cuentasFiltradas = cuentas.filter(
    (c) =>
      c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.estado.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
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
      proveedor: '',
      importe: '',
      estado: 'Pendiente',
      descripcion: '',
      gasto_id: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { fecha, proveedor, importe, estado, descripcion, gasto_id, id } = form;

    if (!fecha || !proveedor.trim() || !estado) {
      return Alert.alert('Campos requeridos', 'Fecha, proveedor y estado son obligatorios.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return Alert.alert('Error', 'La fecha debe estar en formato AAAA-MM-DD.');
    }

    const importeNum = Number(importe);
    if (isNaN(importeNum) || importeNum <= 0) {
      return Alert.alert('Error', 'El importe debe ser un número mayor a 0.');
    }

    if (!estados.includes(estado)) {
      return Alert.alert('Error', 'El estado debe ser "Pendiente" o "Pagado".');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        fecha,
        proveedor: proveedor.trim(),
        importe: importeNum,
        estado,
        descripcion: descripcion.trim() || null,
        gasto_id: gasto_id || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabase.from('cuentas_por_pagar').update(dataEnviar).eq('id', id)
        : await supabase.from('cuentas_por_pagar').insert([dataEnviar]).select().single();

      if (error) throw error;
      Alert.alert('Éxito', id ? 'Cuenta actualizada' : 'Cuenta creada');
      resetForm();
      fetchCuentas();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error al guardar la cuenta');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta cuenta por pagar? Esto puede afectar reportes financieros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('cuentas_por_pagar').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('Éxito', 'Cuenta eliminada');
              fetchCuentas();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error al eliminar la cuenta');
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
      if (!cuentasFiltradas.length) {
        Alert.alert('Sin datos', 'No hay cuentas por pagar para exportar.');
        return;
      }
      const datos = cuentasFiltradas.map((c) => ({
        Fecha: c.fecha,
        Proveedor: c.proveedor,
        Importe: c.importe.toLocaleString('es-CO'),
        Estado: c.estado,
        Descripción: c.descripcion || 'N/A',
        Gasto: c.gastos?.concepto || 'N/A',
        Creado: formatTimestamp(c.created_at),
        Actualizado: formatTimestamp(c.updated_at),
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CuentasPorPagar');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'cuentas_por_pagar.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel');
    } finally {
      setCargandoExportar(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setCargandoExportar(true);
      if (!cuentasFiltradas.length) {
        Alert.alert('Sin datos', 'No hay cuentas por pagar para exportar.');
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
            <h1>Cuentas por Pagar</h1>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Descripción</th>
                  <th>Gasto</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
      `;
      cuentasFiltradas.forEach((c) => {
        html += `
          <tr>
            <td>${c.fecha}</td>
            <td>${c.proveedor}</td>
            <td>${c.importe.toLocaleString('es-CO')}</td>
            <td>${c.estado}</td>
            <td>${c.descripcion || 'N/A'}</td>
            <td>${c.gastos?.concepto || 'N/A'}</td>
            <td>${formatTimestamp(c.created_at)}</td>
            <td>${formatTimestamp(c.updated_at)}</td>
          </tr>
        `;
      });
      html += `
              </tbody>
            </table>
            <div class="total">Total de cuentas: ${cuentasFiltradas.length}</div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF');
    } finally {
      setCargandoExportar(false);
    }
  };

  const editarCuenta = (cuenta) => {
    setForm({
      id: cuenta.id,
      fecha: cuenta.fecha,
      proveedor: cuenta.proveedor,
      importe: cuenta.importe.toString(),
      estado: cuenta.estado,
      descripcion: cuenta.descripcion || '',
      gasto_id: cuenta.gasto_id || '',
    });
    setMostrarFormulario(true);
  };

  return {
    cuentas,
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
    estados,
    cuentasFiltradas,
    handleChange,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarCuenta,
    formatTimestamp,
  };
};
