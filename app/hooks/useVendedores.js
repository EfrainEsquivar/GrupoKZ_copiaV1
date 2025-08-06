import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

export const useVendedores = () => {
  const [vendedores, setVendedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nombre: '',
  });

  useEffect(() => {
    fetchVendedores();
  }, []);

  const fetchVendedores = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los vendedores');
        console.error('Error fetching vendedores:', error);
        return;
      }

      setVendedores(data || []);
    } catch (error) {
      console.error('Error en fetchVendedores:', error);
      Alert.alert('Error', 'Error inesperado al cargar vendedores');
    } finally {
      setCargando(false);
    }
  };

  const vendedoresFiltrados = vendedores.filter((v) =>
    v.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      nombre: '',
    });
    setMostrarFormulario(false);
  };

  const handleGuardar = async () => {
    const { nombre, id } = form;

    if (!nombre.trim()) {
      return Alert.alert('Campos requeridos', 'El nombre es obligatorio.');
    }

    try {
      setCargando(true);
      const dataEnviar = {
        nombre: nombre.trim(),
      };

      const { error } = id
        ? await supabase.from('vendedores').update(dataEnviar).eq('id', id)
        : await supabase.from('vendedores').insert([dataEnviar]);

      if (error) {
        Alert.alert('Error', 'No se pudo guardar el vendedor.');
        console.error('Error saving vendedor:', error);
        return;
      }

      Alert.alert('Éxito', id ? 'Vendedor actualizado correctamente' : 'Vendedor creado correctamente');
      resetForm();
      fetchVendedores();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error inesperado al guardar el vendedor.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este vendedor? Esto puede afectar a clientes asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const { error } = await supabase.from('vendedores').delete().eq('id', id);

              if (error) {
                Alert.alert('Error', 'No se pudo eliminar el vendedor.');
                console.error('Error deleting vendedor:', error);
                return;
              }

              Alert.alert('Éxito', 'Vendedor eliminado correctamente');
              fetchVendedores();
            } catch (error) {
              console.error('Error en handleEliminar:', error);
              Alert.alert('Error', 'Error inesperado al eliminar el vendedor.');
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

      if (vendedoresFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay vendedores para exportar.');
        return;
      }

      const datos = vendedoresFiltrados.map(({ id, nombre }) => ({ nombre }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendedores');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'vendedores.xlsx';

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

      if (vendedoresFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay vendedores para exportar.');
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
            <h1>Lista de Vendedores</h1>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
      `;

      vendedoresFiltrados.forEach((v) => {
        html += `
            <tr>
              <td>${v.nombre}</td>
            </tr>
          `;
      });

      html += `
              </tbody>
            </table>
            <div class="total">Total de vendedores: ${vendedoresFiltrados.length}</div>
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

  const editarVendedor = (vendedor) => {
    setForm({
      id: vendedor.id,
      nombre: vendedor.nombre,
    });
    setMostrarFormulario(true);
  };

  return {
    vendedores,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    cargandoExportar,
    form,
    vendedoresFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    editarVendedor,
  };
};