import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useCuentasPorCobrar = () => {
  const [notasVenta, setNotasVenta] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    id: null,
    folio: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: '',
    subtotal: '',
    iva: '',
    total: '',
    pago_pendiente: '',
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  useEffect(() => {
    fetchNotasVenta();
    fetchClientes();
  }, []);

  const fetchNotasVenta = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('notas_venta')
        .select('*, clientes(nombre_contacto, empresa), created_at, updated_at')
        .gt('pago_pendiente', 0)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setNotasVenta(data || []);
    } catch (error) {
      console.error('Error en fetchNotasVenta:', error);
      Alert.alert('Error', 'Error al cargar cuentas por cobrar');
    } finally {
      setCargando(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre_contacto, empresa')
        .order('nombre_contacto', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error en fetchClientes:', error);
      Alert.alert('Error', 'Error al cargar clientes');
    }
  };

  const notasFiltradas = notasVenta.filter(
    (n) =>
      n.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.clientes.nombre_contacto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (n.clientes.empresa || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const calculateTotal = () => {
    const subtotal = Number(form.subtotal);
    const iva = Number(form.iva) || 0;
    if (!isNaN(subtotal) && !isNaN(iva) && subtotal >= 0) {
      const total = subtotal + iva;
      setForm((prev) => ({
        ...prev,
        total: total.toString(),
        pago_pendiente: total.toString(),
      }));
    }
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
      folio: '',
      fecha: new Date().toISOString().split('T')[0],
      cliente_id: '',
      subtotal: '',
      iva: '',
      total: '',
      pago_pendiente: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { folio, fecha, cliente_id, subtotal, iva, total, pago_pendiente, id } = form;

    if (!folio.trim() || !fecha || !cliente_id) {
      return Alert.alert('Campos requeridos', 'Folio, fecha y cliente son obligatorios.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return Alert.alert('Error', 'La fecha debe estar en formato AAAA-MM-DD.');
    }

    const subtotalNum = Number(subtotal);
    const ivaNum = Number(iva) || 0;
    const totalNum = Number(total);
    const pagoPendienteNum = Number(pago_pendiente);

    if (isNaN(subtotalNum) || subtotalNum <= 0) {
      return Alert.alert('Error', 'El subtotal debe ser un número mayor a 0.');
    }
    if (isNaN(ivaNum) || ivaNum < 0) {
      return Alert.alert('Error', 'El IVA debe ser un número válido.');
    }
    if (isNaN(totalNum) || totalNum <= 0) {
      return Alert.alert('Error', 'El total debe ser un número mayor a 0.');
    }
    if (isNaN(pagoPendienteNum) || pagoPendienteNum < 0) {
      return Alert.alert('Error', 'El pago pendiente debe ser un número válido.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        folio: folio.trim(),
        fecha,
        cliente_id,
        subtotal: subtotalNum,
        iva: ivaNum,
        total: totalNum,
        pago_pendiente: pagoPendienteNum,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabase.from('notas_venta').update(dataEnviar).eq('id', id)
        : await supabase
            .from('notas_venta')
            .insert([dataEnviar])
            .select()
            .single();

      if (error) throw error;
      Alert.alert('Éxito', id ? 'Cuenta actualizada' : 'Cuenta creada');
      resetForm();
      fetchNotasVenta();
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
      '¿Estás seguro de que deseas eliminar esta cuenta por cobrar? Esto puede afectar pedidos o pagos asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('notas_venta').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('Éxito', 'Cuenta eliminada');
              fetchNotasVenta();
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
      if (!notasFiltradas.length) {
        Alert.alert('Sin datos', 'No hay cuentas por cobrar para exportar.');
        return;
      }
      const datos = notasFiltradas.map((n) => ({
        Folio: n.folio,
        Fecha: n.fecha,
        Cliente: `${n.clientes.nombre_contacto} (${n.clientes.empresa || 'N/A'})`,
        Subtotal: n.subtotal.toLocaleString('es-CO'),
        IVA: n.iva.toLocaleString('es-CO'),
        Total: n.total.toLocaleString('es-CO'),
        'Pago Pendiente': n.pago_pendiente.toLocaleString('es-CO'),
        Creado: formatTimestamp(n.created_at),
        Actualizado: formatTimestamp(n.updated_at),
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CuentasPorCobrar');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'cuentas_por_cobrar.xlsx';
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
      if (!notasFiltradas.length) {
        Alert.alert('Sin datos', 'No hay cuentas por cobrar para exportar.');
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
            <h1>Cuentas por Cobrar</h1>
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Subtotal</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Pago Pendiente</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
      `;
      notasFiltradas.forEach((n) => {
        html += `
          <tr>
            <td>${n.folio}</td>
            <td>${n.fecha}</td>
            <td>${n.clientes.nombre_contacto} (${n.clientes.empresa || 'N/A'})</td>
            <td>${n.subtotal.toLocaleString('es-CO')}</td>
            <td>${n.iva.toLocaleString('es-CO')}</td>
            <td>${n.total.toLocaleString('es-CO')}</td>
            <td>${n.pago_pendiente.toLocaleString('es-CO')}</td>
            <td>${formatTimestamp(n.created_at)}</td>
            <td>${formatTimestamp(n.updated_at)}</td>
          </tr>
        `;
      });
      html += `
              </tbody>
            </table>
            <div class="total">Total de cuentas: ${notasFiltradas.length}</div>
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

  const editarNota = (nota) => {
    setForm({
      id: nota.id,
      folio: nota.folio,
      fecha: nota.fecha,
      cliente_id: nota.cliente_id,
      subtotal: nota.subtotal.toString(),
      iva: nota.iva.toString(),
      total: nota.total.toString(),
      pago_pendiente: nota.pago_pendiente.toString(),
    });
    setMostrarFormulario(true);
  };

  return {
    notasVenta,
    clientes,
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
    notasFiltradas,
    handleChange,
    calculateTotal,
    handleDateChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarNota,
    formatTimestamp,
  };
};
