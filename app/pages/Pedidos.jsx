import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';
import PedidoDetails from '../components/pedidos/PedidoDetails';
import Pagination from '../components/pedidos/Pagination';
import { LoadingComponent, EmptyState } from '../components/pedidos/UtilityComponents';
import styles from './styles/Pedidos.styles';

export default function Pedidos() {
  // Estados principales - TODOS LOS HOOKS DEBEN ESTAR AQUÍ AL INICIO
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(null);
  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExportar, setCargandoExportar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aplicarIva, setAplicarIva] = useState(true);
  const [productoEditando, setProductoEditando] = useState(null);
  const [indexEditando, setIndexEditando] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pedidoDetalleOriginal, setPedidoDetalleOriginal] = useState(null);
  const [productosTemporales, setProductosTemporales] = useState([]);
const [modoEdicion, setModoEdicion] = useState(false);
const [cambiosPendientes, setCambiosPendientes] = useState(false);
const [editandoManual, setEditandoManual] = useState(false);


  // Estados del formulario
  const [form, setForm] = useState({
    id: null,
    notas_venta_id: '',
    cliente_id: '',
    productos_id: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    folio: '',
    vendedor_id: '',
    abono: '',
    descuento: '0',
    numero_factura: '',
  });

  const [detalleForm, setDetalleForm] = useState({
  productos_id: '',
  cantidad: '',
  precio_unitario_sin_iva: '',
  precio_unitario_con_iva: '',
  kg_por_millar: '',
  importe_total: '',
  ancho_cm: '',
  largo_cm: '',
  micraje_um: '',
});

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // TODAS LAS FUNCIONES CON useCallback DEBEN ESTAR AQUÍ
  const resetDetalleForm = useCallback(() => {
  setDetalleForm({
    productos_id: '',
    cantidad: '',
    precio_unitario_sin_iva: '',
    precio_unitario_con_iva: '',
    kg_por_millar: '',
    importe_total: '',
    ancho_cm: '',
    largo_cm: '',
    micraje_um: '',
  });
  setEditandoManual(false); // Resetear modo manual
}, []);

const resetForm = useCallback(() => {
  console.log('Reseteando formulario');
  
  setForm({
    id: null,
    notas_venta_id: '',
    cliente_id: '',
    productos_id: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    folio: '',
    vendedor_id: '',
    abono: '',
    descuento: '0',
    numero_factura: '',
  });
  
  setAplicarIva(true);
  setProductosSeleccionados([]);
  setMostrarFormulario(false);
  setMostrarFormularioProducto(false);
  resetDetalleForm();
  setProductoEditando(null);
  setIndexEditando(null);
  setPedidoDetalleOriginal(null);
  setModoEdicion(false);
  setProductosTemporales([]);
  setCambiosPendientes(false);
  
  console.log('Formulario reseteado completamente');
}, [resetDetalleForm]);

  // Función de cálculo de subtotal
  const calculateSubtotal = useCallback((cantidad, productos_id) => {
    const cantidadNum = Number(cantidad || '0');
    const producto = productos.find((p) => p.id === Number(productos_id || ''));

    if (!producto || cantidadNum <= 0) {
      return {
        precio_unitario_sin_iva: '0.00',
        precio_unitario_con_iva: '0.00',
        subtotal: '0.00',
      };
    }

    // Precios por kilo según material
    let precioPorKilo = 50;
    const material = (producto.material || '').toUpperCase();

    switch (material) {
      case 'CELOFAN':
        precioPorKilo = 45;
        break;
      case 'POLIETILENO':
        precioPorKilo = 35;
        break;
      default:
        precioPorKilo = 50;
    }

    let precioUnitario = 0;

    if (material === 'CELOFAN') {
      // Assuming calcularPrecioUnitario is defined elsewhere or passed as prop
      // For now, keeping a placeholder or simplified logic
      precioUnitario = precioPorKilo; // Simplified
    } else if (material === 'POLIETILENO') {
      precioUnitario = precioPorKilo;
    } else {
      precioUnitario = precioPorKilo;
    }

    const subtotalSinIva = precioUnitario * cantidadNum;
    const subtotalConIva = aplicarIva ? subtotalSinIva * 1.16 : subtotalSinIva;

    return {
      precio_unitario_sin_iva: precioUnitario.toFixed(2),
      precio_unitario_con_iva: (aplicarIva ? precioUnitario * 1.16 : precioUnitario).toFixed(2),
      subtotal: subtotalConIva.toFixed(2),
    };
  }, [productos, aplicarIva]);

  const fetchPedidosDetalle = useCallback(async (notaVentaId) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          productos!inner(
            id,
            nombre,
            material,
            tipo,
            ancho_cm,
            largo_cm,
            micraje_um
          ),
          entregas(
            id,
            cantidad,
            unidades,
            fecha_entrega
          )
        `)
        .eq('notas_venta_id', notaVentaId);

      if (error) throw error;

      const productosFormateados = data.map(pedido => ({
        id: pedido.id,
        productos_id: pedido.productos_id,
        cantidad: pedido.cantidad,
        precio_unitario_sin_iva: ((pedido.precio_unitario_venta || 0).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })),
        precio_unitario_con_iva: ((pedido.precio_iva || 0).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })),
        subtotal: ((pedido.importe || 0).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })),
        nombre: pedido.productos.nombre,
        entregas: pedido.entregas || [],
      }));

      setProductosSeleccionados(productosFormateados);
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
      Alert.alert('Error', 'Error al cargar detalles del pedido');
    }
  }, []);

  const fetchPedidos = useCallback(async () => {
    try {
      const { data: notasVentaData, error: notasError } = await supabase
        .from('notas_venta')
        .select(`
          *,
          clientes!inner(
            id,
            nombre_contacto,
            empresa,
            vendedores_id,
            dias_credito,
            estado
          ),
          pedidos(
            id,
            productos_id,
            cantidad,
            precio_kilo_venta,
            precio_unitario_venta,
            precio_iva,
            importe,
            productos!inner(
              id,
              nombre,
              material,
              presentacion,
              tipo,
              ancho_cm,
              largo_cm,
              micraje_um
            ),
            entregas(
              id,
              cantidad,
              unidades,
              fecha_entrega
            )
          ),
          pagos(
            id,
            importe,
            fecha,
            metodo_pago
          )
        `)
        .order('fecha', { ascending: false });

      if (notasError) throw notasError;

      const pedidosProcesados = [];
      
      for (const notaVenta of (notasVentaData || [])) {
        const totalPagado = (notaVenta.pagos || []).reduce((sum, pago) => sum + (pago.importe || 0), 0);
        const pagoPendiente = Math.max((notaVenta.total || 0) - totalPagado, 0);
        
        for (const pedido of (notaVenta.pedidos || [])) {
          pedidosProcesados.push({
            ...pedido,
            notas_venta_id: notaVenta.id,
            notas_venta: {
              ...notaVenta,
              pago_pendiente: pagoPendiente,
              clientes: notaVenta.clientes,
            },
            productos: pedido.productos,
            entregas: pedido.entregas || [],
          });
        }
      }

      setPedidos(pedidosProcesados);
    } catch (error) {
      console.error('Error en fetchPedidos:', error);
      throw error;
    }
  }, []);

  const iniciarModoEdicion = useCallback(() => {
  setModoEdicion(true);
  setProductosTemporales([...productosSeleccionados]);
  setCambiosPendientes(false);
}, [productosSeleccionados]);

const cancelarEdicion = useCallback(() => {
  setModoEdicion(false);
  setProductosTemporales([]);
  setCambiosPendientes(false);
  setMostrarFormularioProducto(false);
  resetDetalleForm();
  setProductoEditando(null);
  setIndexEditando(null);
}, [resetDetalleForm]);




  const fetchClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre_contacto, empresa, vendedores_id, dias_credito')
       
        .order('nombre_contacto', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error en fetchClientes:', error);
      throw error;
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error en fetchProductos:', error);
      throw error;
    }
  }, []);

  const fetchVendedores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Error en fetchVendedores:', error);
      throw error;
    }
  }, []);

  const fetchDatos = useCallback(async () => {
    setCargando(true);
    try {
      await Promise.all([
        fetchPedidos(), 
        fetchClientes(), 
        fetchProductos(), 
        fetchVendedores()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'Error al cargar los datos iniciales');
    } finally {
      setCargando(false);
    }
  }, [fetchPedidos, fetchClientes, fetchProductos, fetchVendedores]);

  // Handlers
  const handleChange = useCallback((campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));

    // Si se cambia el cliente, actualizar el vendedor automáticamente
    if (campo === 'cliente_id' && valor) {
      const cliente = clientes.find(c => c.id === Number(valor));
      if (cliente && cliente.vendedores_id) {
        setForm(prev => ({ ...prev, vendedor_id: cliente.vendedores_id.toString() }));
      }
    }
  }, [clientes]);

  const handleDetalleChange = useCallback((campo, valor) => {
    setDetalleForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('fecha', formattedDate);
    }
  }, [handleChange]);

  const handleEditarProducto = useCallback((producto, index) => {
    setProductoEditando(producto);
    setIndexEditando(index);
    setDetalleForm({
      productos_id: producto.productos_id.toString(),
      cantidad: producto.cantidad.toString(),
      precio_unitario_sin_iva: '',
      precio_unitario_con_iva: '',
      kg_por_millar: '',
      importe_total: '',
    });
    setMostrarFormularioProducto(true);
  }, []);

  const handleCancelarEdicion = useCallback(() => {
    setMostrarFormularioProducto(false);
    resetDetalleForm();
    setProductoEditando(null);
    setIndexEditando(null);
  }, [resetDetalleForm]);

  // Función mejorada para añadir producto (en modo edición)
const handleAñadirProductoTemporal = useCallback(() => {
  const { productos_id, cantidad } = detalleForm;

  if (!productos_id || !cantidad || Number(cantidad) <= 0) {
    Alert.alert('Error', 'Debe seleccionar un producto y especificar una cantidad válida.');
    return;
  }

  const precios = calculateSubtotal(cantidad, productos_id);
  const producto = productos.find((p) => p.id === Number(productos_id));

  if (!producto) {
    Alert.alert('Error', 'Producto no encontrado.');
    return;
  }

  if (indexEditando !== null) {


      // Editar producto existente
     const productoExistente = productosTemporales.find(
      (p, idx) => Number(p.productos_id) === Number(productos_id) && idx !== indexEditando
    );

    if (productoExistente) {
      Alert.alert('Error', 'Este producto ya está en la lista.');
      return;
    }

    const productoEditado = {
      productos_id: Number(productos_id),
      cantidad: Number(cantidad),
      precio_unitario_sin_iva: precios.precio_unitario_sin_iva,
      precio_unitario_con_iva: precios.precio_unitario_con_iva,
      subtotal: precios.subtotal,
      nombre: producto.nombre,
    };

    setProductosTemporales((prev) => {
      const nuevaLista = [...prev];
      nuevaLista[indexEditando] = productoEditado;
      return nuevaLista;
    });

    setProductoEditando(null);
    setIndexEditando(null);
  } else {


   const productoExistente = productosTemporales.find(
      (p) => Number(p.productos_id) === Number(productos_id)
    );

    if (productoExistente) {
      Alert.alert('Error', 'Este producto ya está en la lista.');
      return;
    }

    const nuevoProducto = {
      productos_id: Number(productos_id),
      cantidad: Number(cantidad),
      precio_unitario_sin_iva: precios.precio_unitario_sin_iva,
      precio_unitario_con_iva: precios.precio_unitario_con_iva,
      subtotal: precios.subtotal,
      nombre: producto.nombre,
    };

    setProductosTemporales((prev) => [...prev, nuevoProducto]);
  }

  setCambiosPendientes(true);
  resetDetalleForm();
  setMostrarFormularioProducto(false);
}, [detalleForm, calculateSubtotal, productos, productosTemporales, indexEditando, resetDetalleForm]);


 // Función para eliminar producto temporal
const handleEliminarProductoTemporal = useCallback((index) => {
  setProductosTemporales((prev) => prev.filter((_, i) => i !== index));
  setCambiosPendientes(true);
}, []);
const handleGuardar = useCallback(async () => {
  const { cliente_id, fecha, vendedor_id, id, abono, descuento, numero_factura } = form;

  if (!cliente_id || !fecha || !vendedor_id) {
    Alert.alert('Campos requeridos', 'Cliente, fecha y vendedor son obligatorios.');
    return;
  }

  const abonoNum = Number(abono) || 0;
  const descuentoNum = Number(descuento) || 0;

  if (productosSeleccionados.length === 0) {
    Alert.alert('Error', 'Debe agregar al menos un producto.');
    return;
  }

  if (abonoNum < 0 || descuentoNum < 0) {
    Alert.alert('Error', 'El abono y el descuento no pueden ser negativos.');
    return;
  }

  try {
    setCargando(true);

    // Calcular totales
    let subtotalTotal = productosSeleccionados.reduce((acc, p) => {
      const subtotalLimpio = p.subtotal.toString().replace(/[^0-9.-]+/g, '');
      return acc + Number(subtotalLimpio);
    }, 0);

    const ivaTotal = aplicarIva ? subtotalTotal * 0.16 : 0;
    const totalFinal = subtotalTotal + ivaTotal - descuentoNum;

    if (totalFinal <= 0) {
      Alert.alert('Error', 'El total debe ser mayor a 0.');
      return;
    }

    const notaVentaData = {
      fecha,
      clientes_id: Number(cliente_id),
      subtotal: subtotalTotal,
      iva: ivaTotal,
      total: totalFinal,
      descuento: descuentoNum,
      numero_factura: numero_factura || null,
    };

    let notaVentaId;
    
    // Determinar si estamos en modo edición
    const esEdicion = form.notas_venta_id && form.notas_venta_id !== '' && form.notas_venta_id !== null;
    
    if (esEdicion) {
      // MODO EDICIÓN
      notaVentaId = Number(form.notas_venta_id);
      
      const { error: notaUpdateError } = await supabase
        .from('notas_venta')
        .update(notaVentaData)
        .eq('id', notaVentaId);

      if (notaUpdateError) {
        throw notaUpdateError;
      }

      // Eliminar pedidos anteriores
      await supabase
        .from('pedidos')
        .delete()
        .eq('notas_venta_id', notaVentaId);
        
    } else {
      // MODO CREACIÓN
      const { data: notaData, error: notaError } = await supabase
        .from('notas_venta')
        .insert([notaVentaData])
        .select('id')
        .single();

      if (notaError) {
        throw notaError;
      }
      
      notaVentaId = notaData.id;
    }

    // Actualizar vendedor del cliente
    const cliente = clientes.find((c) => c.id === Number(cliente_id));
    if (cliente && cliente.vendedores_id !== Number(vendedor_id)) {
      await supabase
        .from('clientes')
        .update({ vendedores_id: Number(vendedor_id) })
        .eq('id', cliente_id);
    }

    // Crear pedidos
    const pedidosData = productosSeleccionados.map(p => ({
      notas_venta_id: notaVentaId,
      productos_id: Number(p.productos_id),
      cantidad: Number(p.cantidad),
      precio_kilo_venta: Number(p.precio_unitario_sin_iva.replace(/[^0-9.-]+/g, '')),
      precio_unitario_venta: Number(p.precio_unitario_sin_iva.replace(/[^0-9.-]+/g, '')),
      precio_iva: Number(p.precio_unitario_con_iva.replace(/[^0-9.-]+/g, '')),
      importe: Number(p.subtotal.replace(/[^0-9.-]+/g, '')),
    }));

    const { error: pedidosError } = await supabase
      .from('pedidos')
      .insert(pedidosData);

    if (pedidosError) {
      throw pedidosError;
    }

    // Registrar abono inicial
    if (abonoNum > 0) {
      await supabase
        .from('pagos')
        .insert([{
          notas_venta_id: notaVentaId,
          fecha: new Date().toISOString().split('T')[0],
          importe: abonoNum,
          metodo_pago: 'efectivo',
        }]);
    }

    Alert.alert('Éxito', esEdicion ? 'Pedido actualizado correctamente' : 'Pedido creado correctamente');
    
    // Si estábamos editando desde la vista de detalles, volver a ella
    if (pedidoDetalleOriginal) {
      await fetchPedidos();
      const pedidoActualizado = pedidos.find(p => p.notas_venta_id === notaVentaId);
      if (pedidoActualizado) {
        setMostrarDetalles(pedidoActualizado);
      }
      setPedidoDetalleOriginal(null);
    }
    
    resetForm();
    await fetchPedidos();
    
  } catch (error) {
    console.error('Error en handleGuardar:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.code === '23505') {
      errorMessage = 'Error de duplicación de ID. Por favor, intente nuevamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Error', 'Error al guardar el pedido: ' + errorMessage);
  } finally {
    setCargando(false);
  }
}, [form, productosSeleccionados, aplicarIva, clientes, resetForm, fetchPedidos, pedidoDetalleOriginal, pedidos]);
const handleEliminarProducto = useCallback((index) => {
  setProductosSeleccionados((prev) => prev.filter((_, i) => i !== index));
}, []);

const handleAñadirProducto = useCallback(() => {
  const { productos_id, cantidad } = detalleForm;

  console.log('handleAñadirProducto: detalleForm', detalleForm);
  console.log('handleAñadirProducto: productos_id', productos_id, 'cantidad', cantidad);

  if (!productos_id || !cantidad || Number(cantidad) <= 0) {
    Alert.alert('Error', 'Debe seleccionar un producto y especificar una cantidad válida.');
    return;
  }

  const precios = calculateSubtotal(cantidad, productos_id);
  const producto = productos.find((p) => p.id === Number(productos_id));

  if (!producto) {
    Alert.alert('Error', 'Producto no encontrado.');
    return;
  }

  if (indexEditando !== null) {
    // Editar producto existente
    const productoExistente = productosSeleccionados.find(
      (p, idx) => Number(p.productos_id) === Number(productos_id) && idx !== indexEditando
    );

    console.log('handleAñadirProducto (edit mode): productoExistente', productoExistente);

    if (productoExistente) {
      Alert.alert('Error', 'Este producto ya está en la lista.');
      return;
    }

    const productoEditado = {
      productos_id: Number(productos_id),
      cantidad: Number(cantidad),
      precio_unitario_sin_iva: precios.precio_unitario_sin_iva,
      precio_unitario_con_iva: precios.precio_unitario_con_iva,
      subtotal: precios.subtotal,
      nombre: producto.nombre,
    };

    setProductosSeleccionados((prev) => {
      const nuevaLista = [...prev];
      nuevaLista[indexEditando] = productoEditado;
      return nuevaLista;
    });

    setProductoEditando(null);
    setIndexEditando(null);
  } else {
    // Agregar nuevo producto
    const productoExistente = productosSeleccionados.find(
      (p) => Number(p.productos_id) === Number(productos_id)
    );

    console.log('handleAñadirProducto (add mode): productoExistente', productoExistente);

    if (productoExistente) {
      Alert.alert('Error', 'Este producto ya está en la lista.');
      return;
    }

    const nuevoProducto = {
      productos_id: Number(productos_id),
      cantidad: Number(cantidad),
      precio_unitario_sin_iva: precios.precio_unitario_sin_iva,
      precio_unitario_con_iva: precios.precio_unitario_con_iva,
      subtotal: precios.subtotal,
      nombre: producto.nombre,
    };

    setProductosSeleccionados((prev) => [...prev, nuevoProducto]);
  }

  resetDetalleForm();
  setMostrarFormularioProducto(false);
}, [detalleForm, calculateSubtotal, productos, productosSeleccionados, indexEditando, resetDetalleForm]);




const guardarCambiosPedido = useCallback(async () => {
  if (!mostrarDetalles || productosTemporales.length === 0) {
    Alert.alert('Error', 'Debe tener al menos un producto en el pedido.');
    return;
  }

  try {
    setCargando(true);

    const notaVentaId = mostrarDetalles.notas_venta_id;

    // Calcular nuevos totales
    let subtotalTotal = productosTemporales.reduce((acc, p) => {
      const subtotalLimpio = p.subtotal.toString().replace(/[^0-9.-]+/g, '');
      return acc + Number(subtotalLimpio);
    }, 0);

    const ivaTotal = subtotalTotal * 0.16;
    const totalFinal = subtotalTotal + ivaTotal - (mostrarDetalles.notas_venta?.descuento || 0);

    // Actualizar nota de venta
    const { error: notaUpdateError } = await supabase
      .from('notas_venta')
      .update({
        subtotal: subtotalTotal,
        iva: ivaTotal,
        total: totalFinal,
      })
      .eq('id', notaVentaId);

    if (notaUpdateError) throw notaUpdateError;

    // Eliminar pedidos anteriores
    await supabase
      .from('pedidos')
      .delete()
      .eq('notas_venta_id', notaVentaId);

    // Crear nuevos pedidos
    const pedidosData = productosTemporales.map(p => ({
      notas_venta_id: notaVentaId,
      productos_id: Number(p.productos_id),
      cantidad: Number(p.cantidad),
      precio_kilo_venta: Number(p.precio_unitario_sin_iva.replace(/[^0-9.-]+/g, '')),
      precio_unitario_venta: Number(p.precio_unitario_sin_iva.replace(/[^0-9.-]+/g, '')),
      precio_iva: Number(p.precio_unitario_con_iva.replace(/[^0-9.-]+/g, '')),
      importe: Number(p.subtotal.replace(/[^0-9.-]+/g, '')),
    }));

    const { error: pedidosError } = await supabase
      .from('pedidos')
      .insert(pedidosData);

    if (pedidosError) throw pedidosError;

    Alert.alert('Éxito', 'Pedido actualizado correctamente');
    
    // Actualizar estados
    setProductosSeleccionados([...productosTemporales]);
    setModoEdicion(false);
    setProductosTemporales([]);
    setCambiosPendientes(false);
    
    // Recargar datos
    await fetchPedidos();
    await fetchPedidosDetalle(notaVentaId);

  } catch (error) {
    console.error('Error al guardar cambios:', error);
    Alert.alert('Error', 'Error al guardar los cambios: ' + (error.message || 'Error desconocido'));
  } finally {
    setCargando(false);
  }
}, [mostrarDetalles, productosTemporales, fetchPedidos, fetchPedidosDetalle]);




const handleEditarProductoTemporal = useCallback((producto, index) => {
  setProductoEditando(producto);
  setIndexEditando(index);
  setDetalleForm({
    productos_id: producto.productos_id.toString(),
    cantidad: producto.cantidad.toString(),
    precio_unitario_sin_iva: '',
    precio_unitario_con_iva: '',
    kg_por_millar: '',
    importe_total: '',
  });
  setMostrarFormularioProducto(true);
}, []);
        


// Debe estar DENTRO del componente, después de todos los useState
const handleEliminar = useCallback(async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
    return;
  }
  
  try {
    setCargando(true);
    console.log('Eliminando pedido ID:', id);
    
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } else {
      alert('Pedido eliminado');
      await fetchPedidos();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  } finally {
    setCargando(false);
  }
}, [fetchPedidos]);

  const handleEntregar = useCallback(async (id) => {
    try {
      setCargando(true);

      console.log('Eliminando movimientos de almacén...');
      const { data: entregasData, error: entregasError } = await supabase
              .from('entregas')
              .select('id')
              .in('pedidos_id', await supabase
                .from('pedidos')
                .select('id')
                .eq('notas_venta_id', pedido.notas_venta_id)
                .then(res => res.data?.map(p => p.id) || [])
              );

            if (entregasError) {
              console.error('Error al obtener entregas:', entregasError);
            }

            

      // Buscar el pedido y su nota de venta
            const pedido = pedidos.find((p) => p.id === id);
            if (!pedido) {
              throw new Error('Pedido no encontrado');
            }

            console.log('Pedido encontrado:', {
              pedidoId: pedido.id,
              notaVentaId: pedido.notas_venta_id
            });

      const unidades = pedido.productos?.material === 'POLIETILENO' ? 'kilos' : 'millares';

      const entregaData = {
        pedidos_id: id,
        cantidad: pedido.cantidad,
        unidades: unidades,
        fecha_entrega: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase.from('entregas').insert([entregaData]);
      if (error) throw error;

      // Crear movimiento en almacén
      const material = pedido.productos?.material?.toUpperCase();
      if (material === 'CELOFAN') {
        await supabase.from('almacen_celofan_movimientos').insert([{
          fecha: new Date().toISOString().split('T')[0],
          producto_id: pedido.productos_id,
          millares: pedido.cantidad,
          movimiento: 'SALIDA',
          entrega_id: id,
        }]);
      } else if (material === 'POLIETILENO') {
        await supabase.from('almacen_polietileno_movimientos').insert([{
          fecha: new Date().toISOString().split('T')[0],
          producto_id: pedido.productos_id,
          kilos: pedido.cantidad,
          movimiento: 'SALIDA',
          entrega_id: id,
        }]);
      }

      Alert.alert('Éxito', 'Pedido marcado como entregado');
      await fetchPedidos();
    } catch (error) {
      console.error('Error al entregar pedido:', error);
      Alert.alert('Error', 'Error al marcar como entregado: ' + error.message);
    } finally {
      setCargando(false);
    }
  }, [pedidos, fetchPedidos]);

  const handleAbonar = useCallback(async (id) => {
    const pedido = pedidos.find((p) => p.id === id);

    if (!pedido?.notas_venta) {
      Alert.alert('Error', 'No se pudo encontrar la información del pedido.');
      return;
    }

    const mostrarPrompt = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const resultado = window.prompt('Ingrese el monto del abono (MX$):', '');
          resolve(resultado);
        } else {
          Alert.prompt(
            'Abono',
            'Ingrese el monto del abono (MX$):',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
              { text: 'OK', onPress: (text) => resolve(text) },
            ],
            'plain-text'
          );
        }
      });
    };

    try {
      const abonoStr = await mostrarPrompt();
      if (!abonoStr) return;

      const abonoNum = Number(abonoStr.replace(/[^0-9.-]+/g, '')) || 0;

      if (abonoNum <= 0) {
        Alert.alert('Error', 'El abono debe ser mayor a 0.');
        return;
      }

      if (abonoNum > pedido.notas_venta.pago_pendiente) {
        Alert.alert('Error', 'El abono no puede ser mayor al pago pendiente.');
        return;
      }

      setCargando(true);

      const { error: pagoError } = await supabase.from('pagos').insert([{
        notas_venta_id: pedido.notas_venta_id,
        fecha: new Date().toISOString().split('T')[0],
        importe: abonoNum,
        metodo_pago: 'efectivo',
      }]);

      if (pagoError) throw pagoError;

      Alert.alert('Éxito', 'Abono registrado correctamente');
      await fetchPedidos();
    } catch (error) {
      console.error('Error en handleAbonar:', error);
      Alert.alert('Error', 'Error al registrar el abono: ' + error.message);
    } finally {
      setCargando(false);
    }
  }, [pedidos, fetchPedidos]);

 const editarPedido = useCallback((pedido) => {
  if (!pedido?.notas_venta?.clientes) {
    Alert.alert('Error', 'Información del pedido incompleta');
    return;
  }

  console.log('Editando pedido:', {
    pedidoId: pedido.id,
    notaVentaId: pedido.notas_venta_id,
    clienteId: pedido.notas_venta.clientes.id
  });

  // Guardar referencia del pedido si venimos desde detalles
  if (mostrarDetalles) {
    setPedidoDetalleOriginal(pedido);
  }

  // Configurar el formulario para modo edición
  setForm({
    id: pedido.id, // ID del pedido individual
    notas_venta_id: pedido.notas_venta_id, // ID de la nota de venta - CLAVE PARA IDENTIFICAR EDICIÓN
    cliente_id: pedido.notas_venta.clientes.id?.toString() || '',
    productos_id: '',
    cantidad: '',
    fecha: pedido.notas_venta.fecha || new Date().toISOString().split('T')[0],
    folio: pedido.id?.toString() || '',
    vendedor_id: pedido.notas_venta.clientes.vendedores_id?.toString() || '',
    abono: '',
    descuento: pedido.notas_venta.descuento?.toString() || '0',
    numero_factura: pedido.notas_venta.numero_factura || '',
  });
  
  console.log('Formulario configurado para edición:', {
    notas_venta_id: pedido.notas_venta_id,
    cliente_id: pedido.notas_venta.clientes.id?.toString()
  });
  
  // Cargar los productos existentes de esta nota de venta
  fetchPedidosDetalle(pedido.notas_venta_id);
  
  // Configurar IVA basándose en la nota de venta existente
  setAplicarIva((pedido.notas_venta.iva || 0) > 0);
  
  // Mostrar el formulario
  setMostrarFormulario(true);
  setMostrarDetalles(null);
}, [fetchPedidosDetalle, mostrarDetalles]);

  const handleVerDetalles = useCallback((pedido) => {
    if (!pedido?.productos || !pedido?.notas_venta) {
      Alert.alert('Error', 'Información del pedido incompleta');
      return;
    }
    setMostrarDetalles(pedido);
  }, []);

  const handleVolver = useCallback(() => {
    console.log('Volviendo...', { 
      mostrarFormulario, 
      mostrarDetalles: !!mostrarDetalles,
      pedidoDetalleOriginal: !!pedidoDetalleOriginal 
    });






    // Si estamos volviendo desde el formulario y teníamos un pedido original
     if (mostrarFormulario && pedidoDetalleOriginal) {
    console.log('Volviendo a detalles desde formulario');
    setMostrarDetalles(pedidoDetalleOriginal);
    setPedidoDetalleOriginal(null);
    resetForm();
  } else if (mostrarFormulario) {
    // Volver desde formulario a lista principal
    console.log('Volviendo a lista principal desde formulario');
      setMostrarFormulario(false);
      setMostrarDetalles(null);
      setPedidoDetalleOriginal(null);
      resetForm();
      resetDetalleForm();
  } else {
    
      // Comportamiento normal
      console.log('Volviendo a lista principal desde detalles');
      setMostrarDetalles(null);
      setMostrarFormularioProducto(false);
      setProductosSeleccionados([]);
      setProductoEditando(null);
      setIndexEditando(null);
      setModoEdicion(false);
      setProductosTemporales([]);
      setCambiosPendientes(false);
      resetDetalleForm();
    }
  }, [mostrarFormulario, pedidoDetalleOriginal, resetForm, resetDetalleForm]);

  // Funciones de exportación
  const exportarExcel = useCallback(async () => {
    const pedidosFiltrados = pedidos.filter((p) => {
      if (!p?.productos || !p?.notas_venta?.clientes) return false;
      if (!busqueda.trim()) return true;
      
      const busquedaLower = busqueda.toLowerCase().trim();
      const searchableText = [
        p.productos.nombre || '',
        p.notas_venta.clientes.nombre_contacto || '',
        p.notas_venta.clientes.empresa || '',
        p.id?.toString() || '',
        p.notas_venta.numero_factura || '',
        p.productos.material || '',
      ].join(' ').toLowerCase();

      return searchableText.includes(busquedaLower);
    });

    if (pedidosFiltrados.length === 0) {
      Alert.alert('Sin datos', 'No hay pedidos para exportar.');
      return;
    }

    try {
      setCargandoExportar(true);

      const datos = pedidosFiltrados.map((p) => {
        const vendedorPedido = vendedores.find((v) => v.id === p.notas_venta?.clientes?.vendedores_id);
        const pagado = (p.notas_venta?.pago_pendiente || 0) <= 0;
        const medidas = p.productos ? `${p.productos.ancho_cm}x${p.productos.largo_cm}cm ${p.productos.micraje_um}μm` : 'N/A';

        return {
          Folio: p.id || 'N/A',
          Fecha: p.notas_venta?.fecha || 'N/A',
          'No. Factura': p.notas_venta?.numero_factura || 'Sin factura',
          Cliente: p.notas_venta?.clientes?.nombre_contacto || 'N/A',
          Empresa: p.notas_venta?.clientes?.empresa || 'N/A',
          Vendedor: vendedorPedido?.nombre || 'Sin asignar',
          Material: p.productos?.material || 'N/A',
          Tipo: p.productos?.tipo || 'N/A',
          Producto: p.productos?.nombre || 'N/A',
          Medidas: medidas,
          Cantidad: `${p.cantidad || 0} ${p.productos?.material === 'POLIETILENO' ? 'kg' : 'millares'}`,
          'Precio Unitario (MX$)': Number(p.precio_iva || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          'Importe (MX$)': Number(p.importe || 0).toLocaleString('es-MX', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }),
          'Descuento (MX$)': (p.notas_venta?.descuento || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          'Total Nota (MX$)': (p.notas_venta?.total || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          'Pago Pendiente (MX$)': (p.notas_venta?.pago_pendiente || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          'Estado Entrega': p.entregas?.length > 0 ? 'Entregado' : 'Pendiente',
          'Estado Pago': pagado ? 'Pagado' : 'Pendiente',
          'Días Crédito': p.notas_venta?.clientes?.dias_credito || 0,
        };
      });

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');

      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const timestamp = new Date().getTime();
      const uri = FileSystem.cacheDirectory + `pedidos_${timestamp}.xlsx`;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel: ' + error.message);
    } finally {
      setCargandoExportar(false);
    }
  }, [pedidos, busqueda, vendedores]);

  const exportarPDF = useCallback(async () => {
    const pedidosFiltrados = pedidos.filter((p) => {
      if (!p?.productos || !p?.notas_venta?.clientes) return false;
      if (!busqueda.trim()) return true;
      
      const busquedaLower = busqueda.toLowerCase().trim();
      const searchableText = [
        p.productos.nombre || '',
        p.notas_venta.clientes.nombre_contacto || '',
        p.notas_venta.clientes.empresa || '',
        p.id?.toString() || '',
        p.notas_venta.numero_factura || '',
        p.productos.material || '',
      ].join(' ').toLowerCase();

      return searchableText.includes(busquedaLower);
    });

    if (pedidosFiltrados.length === 0) {
      Alert.alert('Sin datos', 'No hay pedidos para exportar.');
      return;
    }

    try {
      setCargandoExportar(true);

      const fechaActual = new Date();
      const fechaFormateada = fechaActual.toLocaleString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
        hour12: true,
      });

      let totalGeneral = 0;
      let totalPendiente = 0;

      const filasPedidos = pedidosFiltrados.map((p) => {
        const vendedorPedido = vendedores.find((v) => v.id === p.notas_venta?.clientes?.vendedores_id);
        const pagado = (p.notas_venta?.pago_pendiente || 0) <= 0;
        const entregado = p.entregas?.length > 0;
        const unidades = p.productos?.material === 'POLIETILENO' ? 'kg' : 'mill';

        totalGeneral += (p.importe || 0);
        totalPendiente += (p.notas_venta?.pago_pendiente || 0);

        return `
          <tr>
            <td>${p.id || 'N/A'}</td>
            <td>${p.notas_venta?.fecha || 'N/A'}</td>
            <td>${p.notas_venta?.clientes?.nombre_contacto || 'N/A'}</td>
            <td>${vendedorPedido?.nombre || 'Sin asignar'}</td>
            <td>${p.productos?.nombre || 'N/A'}</td>
            <td>${p.productos?.material || 'N/A'}</td>
            <td>${p.cantidad || 0} ${unidades}</td>
            <td>${(p.precio_iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${(p.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${(p.notas_venta?.pago_pendiente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="color: ${entregado ? '#22c55e' : '#eab308'}">${entregado ? 'Entregado' : 'Pendiente'}</td>
            <td style="color: ${pagado ? '#22c55e' : '#ef4444'}">${pagado ? 'Pagado' : 'Pendiente'}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333; 
                line-height: 1.4;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 20px;
              }
              h1 { 
                color: #1f2937; 
                margin-bottom: 10px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px; 
                font-size: 10px; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 6px; 
                text-align: left; 
              }
              th { 
                background-color: '#3b82f6'; 
                color: white;
                font-weight: bold; 
              }
              .total { 
                font-weight: bold; 
                margin-top: 20px; 
                text-align: center;
                background-color: '#f3f4f6';
                padding: 20px;
                border-radius: 8px;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: '#6b7280';
                border-top: 1px solid '#e5e7eb';
                padding-top: 15px;
              }
              @page { size: landscape; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Lista de Pedidos</h1>
              <p>Sistema de Gestión de Pedidos KZ</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Producto</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Importe</th>
                  <th>Pendiente</th>
                  <th>Entrega</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                ${filasPedidos}
              </tbody>
            </table>
            
            <div class="total">
              <p><strong>Total de pedidos:</strong> ${pedidosFiltrados.length}</p>
              <p><strong>Importe total:</strong> ${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p><strong>Total pendiente de pago:</strong> ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div class="footer">
              <p>Generado el: ${fechaFormateada}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF: ' + error.message);
    } finally {
      setCargandoExportar(false);
    }
  }, [pedidos, busqueda, vendedores]);

  // Filtrado de pedidos - CALCULAR AQUÍ DIRECTAMENTE SIN useMemo
  const pedidosFiltrados = (() => {
    if (!busqueda.trim()) return pedidos;
    
    const busquedaLower = busqueda.toLowerCase().trim();
    return pedidos.filter((p) => {
      if (!p?.productos || !p?.notas_venta?.clientes) return false;

      const searchableText = [
        p.productos.nombre || '',
        p.notas_venta.clientes.nombre_contacto || '',
        p.notas_venta.clientes.empresa || '',
        p.id?.toString() || '',
        p.notas_venta.numero_factura || '',
        p.productos.material || '',
      ].join(' ').toLowerCase();

      return searchableText.includes(busquedaLower);
    });
  })();

  // Paginación
  const totalPages = Math.ceil(pedidosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pedidosPaginados = pedidosFiltrados.slice(startIndex, endIndex);

  // Cargar datos iniciales
  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  // Efecto para actualizar vendedor cuando se selecciona un cliente
  useEffect(() => {
    if (form.cliente_id) {
      const cliente = clientes.find(c => c.id === Number(form.cliente_id));
      if (cliente && cliente.vendedores_id) {
        setForm(prev => ({ ...prev, vendedor_id: cliente.vendedores_id.toString() }));
      }
    }
  }, [form.cliente_id, clientes]);



  // Theme para inputs
  const inputTheme = {
    colors: {
      primary: '#3b82f6',
      text: '#ffffff',
      placeholder: '#ccc',
      background: '#1e293b',
    },
  };

  // Render condicional para vista de detalles
  if (mostrarDetalles) {
    return (
      <PedidoDetails
        pedido={mostrarDetalles}
        onVolver={handleVolver}
        vendedores={vendedores}
        productos={productos}
        cargando={cargando}
        onEditarPedido={editarPedido}
        onEliminarPedido={handleEliminar}
        onEntregar={handleEntregar}
        onAbonar={handleAbonar}
        productosSeleccionados={productosSeleccionados}
        setProductosSeleccionados={setProductosSeleccionados}
        fetchPedidosDetalle={fetchPedidosDetalle}
        handleAñadirProducto={handleAñadirProducto}
        handleEliminarProducto={handleEliminarProducto}
        mostrarFormularioProducto={mostrarFormularioProducto}
        setMostrarFormularioProducto={setMostrarFormularioProducto}
        detalleForm={detalleForm}
        handleDetalleChange={handleDetalleChange}
        resetDetalleForm={resetDetalleForm}
        onEditarProducto={handleEditarProducto}
        handleCancelarEdicion={handleCancelarEdicion}
        productoEditando={productoEditando}
        indexEditando={indexEditando}
          modoEdicion={modoEdicion}
  productosTemporales={productosTemporales}
  cambiosPendientes={cambiosPendientes}
  iniciarModoEdicion={iniciarModoEdicion}
  cancelarEdicion={cancelarEdicion}
  guardarCambiosPedido={guardarCambiosPedido}
  handleAñadirProductoTemporal={handleAñadirProductoTemporal}
  handleEliminarProductoTemporal={handleEliminarProductoTemporal}
  handleEditarProductoTemporal={handleEditarProductoTemporal}
      />
    );
  }

  // Render condicional para formulario
  if (mostrarFormulario) {
    // Calcular totales del formulario directamente
    const totalesFormulario = (() => {
      let subtotal = productosSeleccionados.reduce((acc, p) => {
        const subtotalLimpio = p.subtotal.toString().replace(/[^0-9.-]+/g, '');
        return acc + Number(subtotalLimpio);
      }, 0);
      
      const iva = aplicarIva ? subtotal * 0.16 : 0;
      const total = subtotal + iva - Number(form.descuento || 0);
      
      return { subtotal, iva, total };
    })();

    const productoSeleccionadoForm = productos.find(p => p.id === Number(detalleForm.productos_id));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{form.id ? 'Editar Pedido' : 'Nuevo Pedido'}</Text>
          <TouchableOpacity onPress={handleVolver} style={styles.btnVolver}>
            <Ionicons name="arrow-back" size={16} color="#ffffff" />
            <Text style={styles.botonTexto}>Volver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formulario} showsVerticalScrollIndicator={false}>
          {/* Información básica */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>Información Básica</Text>
            
            <View style={styles.row2}>
              <View style={styles.col2}>
                <PaperInput
                  label="Folio"
                  value={form.id?.toString() || 'Nuevo'}
                  mode="outlined"
                  style={styles.input}
                  theme={inputTheme}
                  textColor="#ffffff"
                  disabled={true}
                />
              </View>
              <View style={styles.col2}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} disabled={cargando}>
                  <PaperInput
                    label="Fecha *"
                    value={form.fecha}
                    mode="outlined"
                    style={styles.input}
                    theme={inputTheme}
                    textColor="#ffffff"
                    editable={false}
                    right={<PaperInput.Icon icon="calendar" color="#ffffff" />}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(form.fecha)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.row2}>
              <View style={styles.col2}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.cliente_id}
                    onValueChange={(value) => handleChange('cliente_id', value)}
                    style={styles.picker}
                    enabled={!cargando}
                  >
                    <Picker.Item label="Seleccionar cliente" value="" />
                    {clientes.map((c) => (
                      <Picker.Item
                        key={c.id}
                        label={`${c.nombre_contacto} (${c.empresa || 'N/A'})`}
                        value={c.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.col2}>
                <Text style={styles.label}>Vendedor *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.vendedor_id}
                    onValueChange={(value) => handleChange('vendedor_id', value)}
                    style={styles.picker}
                    enabled={!cargando}
                  >
                    <Picker.Item label="Seleccionar vendedor" value="" />
                    {vendedores.map((v) => (
                      <Picker.Item key={v.id} label={v.nombre} value={v.id.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            
          </View>

          {/* Productos del pedido */}
          <View style={styles.section}>
            <View style={styles.productosHeader}>
              <Text style={styles.subTitle}>Productos del Pedido</Text>
              <TouchableOpacity
                style={styles.btnAnadirProducto}
                onPress={() => setMostrarFormularioProducto(true)}
                disabled={cargando}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.btnAnadirTexto}>Añadir</Text>
              </TouchableOpacity>
            </View>

            {/* Formulario para añadir productos */}
            {mostrarFormularioProducto && (
              <View style={styles.formularioProducto}>
                <Text style={[styles.subTitle, { marginBottom: 12, fontSize: 14 }]}>
                  {indexEditando !== null ? 'Editar Producto' : 'Agregar Producto'}
                </Text>

                <View style={styles.row2}>
                  <View style={styles.col2}>
                    <Text style={styles.label}>Producto</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={detalleForm.productos_id}
                        onValueChange={(value) => handleDetalleChange('productos_id', value)}
                        style={styles.picker}
                        enabled={!cargando}
                      >
                        <Picker.Item label="Seleccionar producto" value="" />
                        {productos.map((p) => (
                          <Picker.Item 
                            key={p.id} 
                            label={`${p.nombre} (${p.material})`} 
                            value={p.id} 
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.col2}>
                    <PaperInput
  label="Cantidad"
  value={detalleForm.cantidad}
  onChangeText={(text) => {
    handleDetalleChange('cantidad', text);

    // Calcular inmediatamente si hay producto seleccionado
    if (detalleForm.productos_id && text) {
      const precios = calculateSubtotal(text, detalleForm.productos_id);
      handleDetalleChange('precio_unitario_sin_iva', precios.precio_unitario_sin_iva);
      handleDetalleChange('precio_unitario_con_iva', precios.precio_unitario_con_iva);
      handleDetalleChange('importe_total', precios.subtotal);
      // kg_por_millar is not directly returned by calculateSubtotal, so it might need a separate calculation or be removed if not used.
      // For now, I'll set it to '0.00' as it was simplified before.
      handleDetalleChange('kg_por_millar', '0.00');
    }
  }}
  mode="outlined"
  style={styles.input}
  keyboardType="numeric"
  theme={inputTheme}
  textColor="#ffffff"
  disabled={cargando}
/>
                  </View>
                </View>

                {/* Información adicional del producto */}
{productoSeleccionadoForm && (
  <View style={styles.productoInfoContainer}>
    <Text style={styles.productoInfoTitle}>Información del Producto (Editable)</Text>
    
    <View style={styles.row2}>
      <View style={styles.col2}>
        <PaperInput
          label="Ancho (cm)"
          value={detalleForm.ancho_cm || productoSeleccionadoForm.ancho_cm?.toString() || ''}
          onChangeText={(text) => {
            setEditandoManual(true);
            handleDetalleChange('ancho_cm', text);
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          theme={inputTheme}
          textColor="#ffffff"
          disabled={cargando}
        />
      </View>
      
      <View style={styles.col2}>
        <PaperInput
          label="Largo (cm)"
          value={detalleForm.largo_cm || productoSeleccionadoForm.largo_cm?.toString() || ''}
          onChangeText={(text) => {
            setEditandoManual(true);
            handleDetalleChange('largo_cm', text);
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          theme={inputTheme}
          textColor="#ffffff"
          disabled={cargando}
        />
      </View>
    </View>

    <View style={styles.row2}>
      <View style={styles.col2}>
        <PaperInput
          label="Micraje (μm)"
          value={detalleForm.micraje_um || productoSeleccionadoForm.micraje_um?.toString() || ''}
          onChangeText={(text) => {
            setEditandoManual(true);
            handleDetalleChange('micraje_um', text);
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          theme={inputTheme}
          textColor="#ffffff"
          disabled={cargando}
        />
      </View>

      <View style={styles.col2}>
        <PaperInput
  label="Precio/Kilo"
  value="110.00"
  mode="outlined"
  style={styles.input}
  theme={inputTheme}
  textColor="#ffffff"
  disabled={true}
  editable={false}
/>
      </View>
    </View>

    <View style={styles.row2}>
      <View style={styles.col2}>
        <PaperInput
          label="Precio con IVA"
          value={detalleForm.precio_unitario_con_iva || '0.00'}
          onChangeText={(text) => {
            setEditandoManual(true);
            handleDetalleChange('precio_unitario_con_iva', text);
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          theme={inputTheme}
          textColor="#ffffff"
          disabled={cargando}
        />
      </View>

      <View style={styles.col2}>
        <PaperInput
          label="Kg por millar"
          value={detalleForm.kg_por_millar || '0.00'}
          onChangeText={(text) => handleDetalleChange('kg_por_millar', text)}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          theme={inputTheme}
          textColor="#ffffff"
          disabled={cargando}
        />
      </View>
    </View>

    <PaperInput
      label="Importe Total"
      value={detalleForm.importe_total || '0.00'}
      onChangeText={(text) => {
        setEditandoManual(true);
        handleDetalleChange('importe_total', text);
      }}
      mode="outlined"
      style={[styles.input, { backgroundColor: '#4b5563' }]}
      keyboardType="numeric"
      theme={{
        ...inputTheme,
        colors: { ...inputTheme.colors, primary: '#3b82f6', text: '#60a5fa' }
      }}
      textColor="#60a5fa"
      disabled={cargando}
    />

  </View>
)}

                <View style={styles.botonesFormularioProducto}>
                  <TouchableOpacity
                    style={styles.btnGuardarProducto}
                    onPress={handleAñadirProducto}
                    disabled={cargando}
                  >
                    {cargando ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.botonTexto}>
                        {indexEditando !== null ? 'Actualizar' : 'Añadir'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnCancelarProducto} 
                    onPress={handleCancelarEdicion}
                    disabled={cargando}
                  >
                    <Text style={styles.botonTexto}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Lista de productos seleccionados */}
            {(modoEdicion ? productosTemporales : productosSeleccionados).length > 0 ? (
              <View style={styles.tablaProductos}>
                <View style={styles.tablaHeader}>
                  <Text style={[styles.tablaHeaderText, { flex: 3 }]}>Producto</Text>
                  <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Cant.</Text>
                  <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Precio</Text>
                  <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Total</Text>
                  <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Acc.</Text>
                </View>

                {(modoEdicion ? productosTemporales : productosSeleccionados).map((producto, index) => {
                  const prod = productos.find(p => p.id === producto.productos_id);
                  const precioFormateado = Number(producto.precio_unitario_con_iva?.replace(/[^0-9.-]+/g, '') || 0);
                  const subtotalFormateado = Number(producto.subtotal?.replace(/[^0-9.-]+/g, '') || 0);
                  
                  return (
                    <View key={`producto-form-${index}`} style={styles.tablaFila}>
                      <View style={[styles.tablaCelda, { flex: 3 }]}>
                        <Text style={styles.tablaCeldaTexto} numberOfLines={1}>
                          {producto.nombre || 'N/A'}
                        </Text>
                      </View>
                      
                      <View style={[styles.tablaCelda, { flex: 1 }]}>
                        <Text style={styles.tablaCeldaTexto}>
                          {producto.cantidad || 0}
                        </Text>
                        <Text style={styles.unidadSubtext}>
                          {prod?.material === 'POLIETILENO' ? 'kg' : 'mill'}
                        </Text>
                      </View>
                      
                      <Text style={[styles.tablaCeldaTexto, { flex: 1, textAlign: 'center' }]}>
                        ${precioFormateado.toLocaleString('es-MX', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      
                      <Text style={[styles.tablaCeldaTexto, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
                        ${subtotalFormateado.toLocaleString('es-MX', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      
                      <View style={[styles.tablaCelda, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }]}>
                        <TouchableOpacity
                          style={styles.accionBtn}
                          onPress={() => handleEditarProducto(producto, index)}
                          disabled={cargando}
                        >
                          <Ionicons name="pencil" size={12} color="#6b7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.accionBtnEliminar}
                          onPress={() => handleEliminarProducto(index)}
                          disabled={cargando}
                        >
                          <Ionicons name="trash" size={12} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyProductos}>
                <Text style={styles.emptyProductosText}>No hay productos agregados</Text>
              </View>
            )}
          </View>

          {/* Configuración adicional */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>Configuración Adicional</Text>
            
            <View style={styles.row2}>
  <View style={styles.col2}>
    <PaperInput
      label="Número de Factura (opcional)"
      value={form.numero_factura}
      onChangeText={(text) => handleChange('numero_factura', text)}
      mode="outlined"
      style={styles.input}
      theme={inputTheme}
      textColor="#ffffff"
      disabled={cargando}
    />
  </View>
  <View style={styles.col2}>
    <PaperInput
      label="Descuento (%)"
      value={form.descuento}
      onChangeText={(text) => handleChange('descuento', text)}
      mode="outlined"
      style={styles.input}
      keyboardType="numeric"
      theme={inputTheme}
      textColor="#ffffff"
      disabled={cargando}
    />
  </View>
</View>

            <View style={styles.facturaRow}>
              <TouchableOpacity
                style={[styles.checkbox, { backgroundColor: aplicarIva ? '#3b82f6' : 'transparent' }]}
                onPress={() => setAplicarIva(!aplicarIva)}
                disabled={cargando}
              >
                {aplicarIva && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </TouchableOpacity>
              <Text style={styles.resumenLabel}>Aplicar IVA (16%)</Text>
            </View>
          </View>

          {/* Resumen del pedido */}
          {productosSeleccionados.length > 0 && (
            <View style={styles.previewCalculos}>
              <Text style={styles.subTitle}>Resumen del Pedido</Text>
              
              <View style={styles.calculosGrid}>
                <View style={styles.calculoItem}>
                  <Text style={styles.calculoLabel}>Total de productos:</Text>
                  <Text style={styles.calculoValor}>
                    {productosSeleccionados.length}
                  </Text>
                </View>
                
                <View style={styles.calculoItem}>
                  <Text style={styles.calculoLabel}>Subtotal:</Text>
                  <Text style={styles.calculoValor}>
                    ${totalesFormulario.subtotal.toLocaleString('es-MX', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </View>
                
                {aplicarIva && (
                  <View style={styles.calculoItem}>
                    <Text style={styles.calculoLabel}>IVA (16%):</Text>
                    <Text style={styles.calculoValor}>
                      ${totalesFormulario.iva.toLocaleString('es-MX', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </Text>
                  </View>
                )}
                
                <View style={styles.calculoItem}>
                  <Text style={styles.calculoLabel}>Descuento:</Text>
                  <Text style={styles.calculoValor}>
                    ${Number(form.descuento || 0).toLocaleString('es-MX', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </View>
                
                <View style={[styles.calculoItem, { borderTopWidth: 1, borderTopColor: '#4b5563', paddingTop: 8, marginTop: 8 }]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValor}>
                    ${totalesFormulario.total.toLocaleString('es-MX', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Botones del formulario */}
          <View style={styles.botonesForm}>
            <TouchableOpacity 
              style={styles.btnGuardar} 
              onPress={handleGuardar} 
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name={form.id ? "checkmark" : "add"} size={16} color="#ffffff" />
                  <Text style={styles.botonTexto}>{form.id ? 'Actualizar' : 'Guardar'}</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.btnCancelarProducto} 
              onPress={handleVolver}
              disabled={cargando}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Vista principal de lista de pedidos
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Pedidos</Text>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => {
            setMostrarFormulario(true);
            setMostrarDetalles(null);
            resetDetalleForm();
          }}
          disabled={cargando}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.botonTexto}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ffffff" />
        <TextInput
          placeholder="Buscar por ID, producto, cliente o material"
          placeholderTextColor="#cccccc"
          style={styles.inputText}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Botones de exportación */}
      <View style={styles.botoneraDerecha}>
        <TouchableOpacity 
          onPress={exportarExcel} 
          style={styles.btnExportarExcel} 
          disabled={cargandoExportar || pedidosFiltrados.length === 0}
        >
          {cargandoExportar ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={16} color="#ffffff" />
              <Text style={styles.botonTexto}>Excel</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={exportarPDF} 
          style={styles.btnExportarPDF} 
          disabled={cargandoExportar || pedidosFiltrados.length === 0}
        >
          {cargandoExportar ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="document-text" size={16} color="#ffffff" />
              <Text style={styles.botonTexto}>PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Estado de carga */}
      {cargando && <LoadingComponent />}

      {/* Lista de pedidos */}
      <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
        {pedidosPaginados.length === 0 ? (
          <EmptyState 
            message="No hay pedidos registrados" 
            hasSearch={busqueda.length > 0} 
          />
        ) : (
          pedidosPaginados.map((p) => {
            const vendedorPedido = vendedores.find((v) => v.id === p.notas_venta?.clientes?.vendedores_id);
            const pagadoPedido = (p.notas_venta?.pago_pendiente || 0) <= 0;
            const entregadoPedido = p.entregas?.length > 0;

            return (
              <View key={`pedido-${p.id}`} style={styles.card}>
                <View style={styles.cardGrid}>
                  <View style={styles.infoCompleta}>
                    <Text style={styles.nombre}>Folio: #{p.id}</Text>
                    <Text style={styles.info}>Cliente: {p.notas_venta?.clientes?.nombre_contacto}</Text>
                    <Text style={styles.info} numberOfLines={1}>
                      Producto: {p.productos?.nombre}
                    </Text>

                    <Text style={styles.label}>Material:</Text>
                    <View style={styles.materialTags}>
                      <View style={styles.materialTag}>
                        <Text style={styles.materialTagText}>{p.productos?.material || 'N/A'}</Text>
                      </View>
                      {p.productos?.tipo && (
                        <View style={styles.tipoMaterialTag}>
                          <Text style={styles.tipoMaterialTagText}>{p.productos.tipo}</Text>
                        </View>
                      )}
                    </View>

                    {/* Información de precios mejorada */}
                   
                  </View>

                  {/* Indicadores de estado */}
                  <View style={styles.statusIndicators}>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBar, { backgroundColor: pagadoPedido ? '#22c55e' : '#e5e7eb' }]} />
                      <Text style={styles.statusLabel}>Pagos</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBar, { backgroundColor: entregadoPedido ? '#3b82f6' : '#e5e7eb' }]} />
                      <Text style={styles.statusLabel}>Entrega</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBar, { backgroundColor: '#eab308' }]} />
                      <Text style={styles.statusLabel}>Crédito</Text>
                    </View>
                  </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.botonesCard}>
                  <TouchableOpacity 
                    onPress={() => handleVerDetalles(p)} 
                    style={styles.btnVerDetalles}
                    disabled={cargando}
                  >
                    <Ionicons name="eye" size={16} color="#ffffff" />
                    <Text style={styles.botonTexto}>Detalles</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => editarPedido(p)} 
                    style={styles.btnEditar} 
                    disabled={cargando}
                  >
                    <Ionicons name="pencil" size={16} color="#ffffff" />
                    <Text style={styles.botonTexto}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleEliminar(p.id)} 
                    style={styles.btnEliminar} 
                    disabled={cargando}
                  >
                    <Ionicons name="trash" size={16} color="#ffffff" />
                    <Text style={styles.botonTexto}>Eliminar</Text>
                  </TouchableOpacity>

                  {!pagadoPedido && (
                    <TouchableOpacity 
                      onPress={() => handleAbonar(p.id)} 
                      style={styles.btnAbonar} 
                      disabled={cargando}
                    >
                      <Ionicons name="cash" size={16} color="#ffffff" />
                      <Text style={styles.botonTexto}>Abonar</Text>
                    </TouchableOpacity>
                  )}

                  {!entregadoPedido && (
                    <TouchableOpacity 
                      onPress={() => handleEntregar(p.id)} 
                      style={styles.btnEntregar} 
                      disabled={cargando}
                    >
                      <Ionicons name="cube" size={16} color="#ffffff" />
                      <Text style={styles.botonTexto}>Entregar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Paginación */}
      {pedidosFiltrados.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pedidosFiltrados.length}
          onPageChange={setCurrentPage}
        />
      )}
    </View>
  );
}