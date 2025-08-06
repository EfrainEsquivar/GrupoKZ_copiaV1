import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const pedidoTypes = ['Celofán', 'Polietileno'];
const presentacionesCelofan = ['Micraje', 'Gramaje'];
const presentacionesPolietileno = ['Bobina', 'Bolsa'];
const tipos = ['Mordaza', 'Lateral', 'Pegol', 'Cenefa + Pegol', 'Negra', 'Semi Natural', 'Virgen', 'Color','100gr C' , '100gr L', '150gr', '200gr','500gr','1kg','1.5kg','2kg','2.5kg','3kg'];

export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({
    id: null,
    material: 'Celofán',
    nombre: '',
    presentacion: 'Micraje',
    tipo: 'Mordaza',
    gramaje: '',
    micraje_um: '',
    ancho_cm: '',
    largo_cm: '',
  });

  const isCelofan = form.material === 'Celofán';
  const isPolietileno = form.material === 'Polietileno';

  useEffect(() => {
    fetchProductos();
  }, []);

  const loadFileData = async (fileName) => {
    // This is a placeholder. In a real Expo app, you'd load from assets or a remote URL.
    // For this example, we'll simulate loading from a local file.
    // You might need to adjust this based on how your CSV is actually stored.
    // For web, you might use fetch to get the CSV from a public folder.
    // For native, you might use FileSystem.readAsStringAsync if it's bundled.
    // For now, returning a dummy CSV string.
    return `id,material,nombre,presentacion,tipo,gramaje,micraje_um,ancho_cm,largo_cm
1,Celofan,Bolsa Celofan 1,Micraje,Mordaza,,
2,Polietileno,Bolsa Polietileno 1,Bobina,Negra,,
`;
  };

  const fetchProductos = async () => {
    try {
      setCargando(true);
      const csvData = await loadFileData('productos_rows.csv');
      
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().replace(/^"|"$/g, ''),
        transform: (value, header) => {
          let cleaned = value.trim().replace(/^"|"$/g, '');
          if (['ancho_cm', 'largo_cm', 'micraje_um'].includes(header)) {
            return cleaned === '' || isNaN(parseFloat(cleaned)) ? null : parseFloat(cleaned);
          }
          return cleaned;
        },
        complete: (results) => {
          const cleanedData = results.data.filter(row => row.nombre && row.material);
          setProductos(cleanedData);
        },
        error: (err) => {
          console.error('CSV parsing error:', err);
          throw new Error('Failed to parse CSV file');
        }
      });
    } catch (error) {
      console.error('Error fetching productos:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter(
      (p) =>
        (p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || false)
    );
  }, [productos, busqueda]);

  const handleChange = (campo, valor) => {
    if (['gramaje', 'micraje_um', 'ancho_cm', 'largo_cm'].includes(campo)) {
      if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
      }
    } else {
      setForm((prev) => ({ ...prev, [campo]: valor }));
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      material: 'Celofán',
      nombre: '',
      presentacion: 'Micraje',
      tipo: 'Mordaza',
      gramaje: '',
      micraje_um: '',
      ancho_cm: '',
      largo_cm: '',
    });
    setMostrarFormulario(false);
  };

  const validarFormulario = () => {
    const errores = [];

    if (!form.nombre.trim()) errores.push('El nombre es requerido');
    if (!form.presentacion) errores.push('La presentación es requerida');
    if (!form.tipo) errores.push('El tipo es requerido');

    const numericFields = [
      { key: 'gramaje', label: 'Gramaje', required: isCelofan && form.presentacion === 'Gramaje' },
      { key: 'micraje_um', label: 'Micraje', required: (isCelofan && form.presentacion === 'Micraje') || isPolietileno },
      { key: 'ancho_cm', label: 'Ancho', required: false },
      { key: 'largo_cm', label: 'Largo', required: false },
    ];

    numericFields.forEach(({ key, label, required }) => {
      if (required && !form[key]) {
        errores.push(`${label} es requerido`);
      } else if (form[key] && form[key].trim() !== '' && isNaN(parseFloat(form[key]))) {
        errores.push(`${label} debe ser un número válido`);
      }
    });

    return errores;
  };

  const handleGuardar = async () => {
    const errores = validarFormulario();
    if (errores.length > 0) {
      Alert.alert('Error de validación', errores.join('\n'));
      return;
    }

    try {
      setCargando(true);
      const newProduct = {
        id: form.id || (productos.length > 0 ? Math.max(...productos.map(p => parseInt(p.id))) + 1 : 1),
        material: form.material,
        nombre: form.nombre,
        presentacion: form.presentacion,
        tipo: form.tipo,
        gramaje: form.gramaje ? parseFloat(form.gramaje) : null,
        micraje_um: form.micraje_um ? parseFloat(form.micraje_um) : null,
        ancho_cm: form.ancho_cm ? parseFloat(form.ancho_cm) : null,
        largo_cm: form.largo_cm ? parseFloat(form.largo_cm) : null,
      };

      if (form.id) {
        setProductos(productos.map(p => p.id === form.id ? newProduct : p));
      } else {
        setProductos([...productos, newProduct]);
      }

      resetForm();
      Alert.alert('Éxito', `Producto ${form.id ? 'actualizado' : 'guardado'} correctamente`);
    } catch (error) {
      console.error('Error saving producto:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el producto');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (producto) => {
    setForm({
      ...producto,
      gramaje: producto.gramaje ? producto.gramaje.toString() : '',
      micraje_um: producto.micraje_um ? producto.micraje_um.toString() : '',
      ancho_cm: producto.ancho_cm ? producto.ancho_cm.toString() : '',
      largo_cm: producto.largo_cm ? producto.largo_cm.toString() : '',
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              setProductos(productos.filter(p => p.id !== id));
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              console.error('Error deleting producto:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el producto');
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
      if (productosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay productos para exportar');
        return;
      }

      setCargando(true);
      const datos = productosFiltrados.map(({ id, ...rest }) => ({
        ...rest,
        dimensiones: `${rest.ancho_cm || 0}cm x ${rest.largo_cm || 0}cm`,
        especificaciones: renderProductInfo(rest) || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'productos.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      Alert.alert('Error', 'No se pudo exportar a Excel');
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = async () => {
    try {
      if (productosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay productos para exportar');
        return;
      }

      setCargando(true);
      let html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Lista de Productos</h1>
            <table>
              <tr>
                <th>Nombre</th>
                <th>Material</th>
                <th>Presentación</th>
                <th>Tipo</th>
                <th>Dimensiones</th>
                <th>Especificaciones</th>
              </tr>
      `;

      productosFiltrados.forEach((p) => {
        const dimensiones = `${p.ancho_cm || 0}cm x ${p.largo_cm || 0}cm`;
        const especificaciones = renderProductInfo(p) || '-';
        html += `
          <tr>
            <td>${p.nombre || ''}</td>
            <td>${p.material || ''}</td>
            <td>${p.presentacion || ''}</td>
            <td>${p.tipo || ''}</td>
            <td>${dimensiones}</td>
            <td>${especificaciones}</td>
          </tr>
        `;
      });

      html += `
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'No se pudo exportar a PDF');
    } finally {
      setCargando(false);
    }
  };

  const renderProductInfo = (producto) => {
    const { material, gramaje, micraje_um } = producto;

    if (material === 'Celofán') {
      const specs = [];
      if (gramaje) specs.push(`${gramaje}g`);
      if (micraje_um) specs.push(`${micraje_um}um`);
      return specs.length > 0 ? specs.join(' - ') : null;
    } else if (material === 'Polietileno' && micraje_um) {
      return `${micraje_um}um`;
    }
    return null;
  };

  return {
    productos,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    form,
    isCelofan,
    isPolietileno,
    productosFiltrados,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
    exportarExcel,
    exportarPDF,
    renderProductInfo,
    pedidoTypes,
    presentacionesCelofan,
    presentacionesPolietileno,
    tipos,
  };
};
