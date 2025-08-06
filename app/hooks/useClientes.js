import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useClientes = () => {
  const [openEstado, setOpenEstado] = useState(false);
  const [itemsEstado, setItemsEstado] = useState([
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
  ]);

  const [clientes, setClientes] = useState([]);
  const [openVendedor, setOpenVendedor] = useState(false);
  const [itemsVendedor, setItemsVendedor] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nombre_contacto: '',
    empresa: '',
    correo: '',
    telefono: '',
    direccion: '',
    dias_credito: '0',
    estado: 'activo',
    vendedor_id: '',
  });

  const estados = ['activo', 'inactivo'];

  useEffect(() => {
    fetchClientes();
    fetchVendedores();
  }, []);

  const fetchClientes = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*, vendedores(nombre)')
        .order('empresa', { ascending: true });

      if (error) {
        console.error('Error fetching clientes:', error);
        Alert.alert('Error', 'No se pudieron cargar los clientes');
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Error en fetchClientes:', error);
      Alert.alert('Error', 'Error inesperado al cargar clientes');
    } finally {
      setCargando(false);
    }
  };

  const fetchVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching vendedores:', error);
        return;
      }

      const vendedorItems = data.map((vendedor) => ({
        label: vendedor.nombre || 'Sin nombre',
        value: vendedor.id,
      }));
      setItemsVendedor(vendedorItems);
      setVendedores(data || []);
    } catch (error) {
      console.error('Error en fetchVendedores:', error);
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombre_contacto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor || '' }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      nombre_contacto: '',
      empresa: '',
      correo: '',
      telefono: '',
      direccion: '',
      dias_credito: '0',
      estado: 'activo',
      vendedor_id: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { nombre_contacto, empresa, correo, telefono, direccion, dias_credito, estado, vendedor_id, id } = form;

    const safeNombreContacto = nombre_contacto || '';
    const safeEmpresa = empresa || '';
    const safeCorreo = correo || '';
    const safeTelefono = telefono || '';

    if (!safeNombreContacto.trim() || !safeEmpresa.trim() || !safeCorreo.trim() || !safeTelefono.trim()) {
      return Alert.alert('Campos requeridos', 'Nombre, empresa, correo y teléfono son obligatorios.');
    }

    const diasCreditoNum = Number(dias_credito);
    if (isNaN(diasCreditoNum) || diasCreditoNum < 0) {
      return Alert.alert('Error', 'Días de crédito debe ser un número no negativo.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        nombre_contacto: safeNombreContacto.trim(),
        empresa: safeEmpresa.trim(),
        correo: safeCorreo.trim(),
        telefono: safeTelefono.trim(),
        direccion: direccion?.trim() || null,
        dias_credito: diasCreditoNum,
        estado,
        vendedor_id: vendedor_id || null,
      };

      const { error } = id
        ? await supabase.from('clientes').update(dataEnviar).eq('id', id)
        : await supabase.from('clientes').insert([dataEnviar]);

      if (error) {
        console.error('Error saving/updating client:', error);
        Alert.alert('Error', `No se pudo ${id ? 'actualizar' : 'guardar'} el cliente: ${error.message}`);
        return;
      }

      Alert.alert('Éxito', id ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
      resetForm();
      fetchClientes();
    } catch (error) {
      console.error('Unexpected error in handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar el cliente.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este cliente? Esto puede afectar pedidos o cuentas por cobrar asociadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('clientes').delete().eq('id', id);

              if (error) {
                console.error('Error deleting client:', error);
                Alert.alert('Error', `No se pudo eliminar el cliente: ${error.message}`);
                return;
              }

              Alert.alert('Éxito', 'Cliente eliminado correctamente');
              fetchClientes();
            } catch (error) {
              console.error('Unexpected error in handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar el cliente.');
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

      if (clientesFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay clientes para exportar.');
        return;
      }

      const datos = clientesFiltrados.map((c) => ({
        'Nombre Contacto': c.nombre_contacto || '-',
        Empresa: c.empresa || '-',
        Correo: c.correo || '-',
        Teléfono: c.telefono || '-',
        Dirección: c.direccion || '-',
        'Días Crédito': c.dias_credito || 0,
        Estado: c.estado || '-',
        Vendedor: c.vendedores?.nombre || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'clientes.xlsx';

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

      if (clientesFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay clientes para exportar.');
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
            <h1>Lista de Clientes</h1>
            <table>
              <thead>
                <tr>
                  <th>Nombre Contacto</th>
                  <th>Empresa</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Días Crédito</th>
                  <th>Estado</th>
                  <th>Vendedor</th>
                </tr>
              </thead>
              <tbody>
      `;

      clientesFiltrados.forEach((c) => {
        html += `
          <tr>
            <td>${c.nombre_contacto || '-'}</td>
            <td>${c.empresa || '-'}</td>
            <td>${c.correo || '-'}</td>
            <td>${c.telefono || '-'}</td>
            <td>${c.direccion || '-'}</td>
            <td>${c.dias_credito || 0}</td>
            <td>${c.estado || '-'}</td>
            <td>${c.vendedores?.nombre || '-'}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de clientes: ${clientesFiltrados.length}</div>
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

  const editarCliente = (cliente) => {
    setForm({
      id: cliente.id,
      nombre_contacto: cliente.nombre_contacto || '',
      empresa: cliente.empresa || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      dias_credito: cliente.dias_credito?.toString() || '0',
      estado: cliente.estado || 'activo',
      vendedor_id: cliente.vendedor_id || '',
    });
    setMostrarFormulario(true);
  };

  return {
    openEstado,
    setOpenEstado,
    itemsEstado,
    setItemsEstado,
    clientes,
    openVendedor,
    setOpenVendedor,
    itemsVendedor,
    setItemsVendedor,
    vendedores,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    setForm,
    estados,
    clientesFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarCliente,
  };
};
