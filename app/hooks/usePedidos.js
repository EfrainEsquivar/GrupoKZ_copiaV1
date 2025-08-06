import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

const calcularPrecioUnitario = (producto, precioKilo) => {
  if (!producto || !precioKilo) return 0;
  
  const { tipo, material, ancho_cm, largo_cm, micraje_um } = producto;
  const anchoNum = parseFloat(ancho_cm) || 0;
  const largoNum = parseFloat(largo_cm) || 0;
  const micrajeNum = parseFloat(micraje_um) || 0;
  const precioKiloNum = parseFloat(precioKilo) || 0;

  switch (tipo?.toUpperCase()) {
    case "MORDAZA":
      return (((largoNum * anchoNum + 2) * 2 * micrajeNum) / 10000) * precioKiloNum;
    case "LATERAL":
      return (((largoNum * anchoNum) * 2 * micrajeNum) / 10000) * precioKiloNum;
    case "PEGOL":
      return (((largoNum * anchoNum + 3) * 2 * micrajeNum) / 10000) * precioKiloNum + (largoNum * 0.12) + 13;
    case "CENEFA + PEGOL":
      return (((largoNum * (anchoNum + 6)) * 2 * micrajeNum) / 10000) * precioKiloNum + (largoNum * 0.21) + 20;
    default:
      if (material?.toLowerCase() === "polietileno") {
        return precioKiloNum;
      }
      return precioKiloNum;
  }
};

const calcularKgPorMillar = (producto) => {
  if (!producto) return 0;
  
  const { tipo, ancho_cm, largo_cm } = producto;
  const anchoNum = parseFloat(ancho_cm) || 0;
  const largoNum = parseFloat(largo_cm) || 0;

  switch (tipo?.toUpperCase()) {
    case "MORDAZA":
      return ((largoNum * (anchoNum + 2) * 2) * 25) / 10000;
    case "LATERAL":
      return ((largoNum * anchoNum * 2) * 25) / 10000;
    case "PEGOL":
      return ((largoNum * (anchoNum + 3) * 2) * 25) / 10000;
    case "CENEFA + PEGOL":
      return ((largoNum * (anchoNum + 6) * 2) * 25) / 10000;
    default:
      return 0;
  }
};

export const usePedidos = () => {
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
    setEditandoManual(false);
  }, []);

  const resetForm = useCallback(() => {
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
  }, [resetDetalleForm]);

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
      precioUnitario = calcularPrecioUnitario(producto, precioPorKilo);
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

  // Reemplaza la función fetchPedidosDetalle con esta versión corregida:

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
      // Manejo seguro de valores nulos con el operador de coalescencia nula
      precio_unitario_sin_iva: (pedido.precio_unitario_venta ?? 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      precio_unitario_con_iva: (pedido.precio_iva ?? 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      subtotal: (pedido.importe ?? 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      nombre: pedido.productos?.nombre || 'Producto sin nombre',
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

  const handleChange = useCallback((campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));

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
      
      const esEdicion = form.notas_venta_id && form.notas_venta_id !== '' && form.notas_venta_id !== null;
      
      if (esEdicion) {
        notaVentaId = Number(form.notas_venta_id);
        
        const { error: notaUpdateError } = await supabase
          .from('notas_venta')
          .update(notaVentaData)
          .eq('id', notaVentaId);

        if (notaUpdateError) {
          throw notaUpdateError;
        }

        await supabase
          .from('pedidos')
          .delete()
          .eq('notas_venta_id', notaVentaId);
          
      } else {
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

      const cliente = clientes.find((c) => c.id === Number(cliente_id));
      if (cliente && cliente.vendedores_id !== Number(vendedor_id)) {
        await supabase
          .from('clientes')
          .update({ vendedores_id: Number(vendedor_id) })
          .eq('id', cliente_id);
      }

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
      const productoExistente = productosSeleccionados.find(
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

      setProductosSeleccionados((prev) => {
        const nuevaLista = [...prev];
        nuevaLista[indexEditando] = productoEditado;
        return nuevaLista;
      });

      setProductoEditando(null);
      setIndexEditando(null);
    } else {
      const productoExistente = productosSeleccionados.find(
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

      let subtotalTotal = productosTemporales.reduce((acc, p) => {
        const subtotalLimpio = p.subtotal.toString().replace(/[^0-9.-]+/g, '');
        return acc + Number(subtotalLimpio);
      }, 0);

      const ivaTotal = subtotalTotal * 0.16;
      const totalFinal = subtotalTotal + ivaTotal - (mostrarDetalles.notas_venta?.descuento || 0);

      const { error: notaUpdateError } = await supabase
        .from('notas_venta')
        .update({
          subtotal: subtotalTotal,
          iva: ivaTotal,
          total: totalFinal,
        })
        .eq('id', notaVentaId);

      if (notaUpdateError) throw notaUpdateError;

      await supabase
        .from('pedidos')
        .delete()
        .eq('notas_venta_id', notaVentaId);

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
      
      setProductosSeleccionados([...productosTemporales]);
      setModoEdicion(false);
      setProductosTemporales([]);
      setCambiosPendientes(false);
      
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

  const handleEliminar = useCallback(async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      return;
    }
    
    try {
      setCargando(true);
      
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

      const pedido = pedidos.find((p) => p.id === id);
      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      const unidades = pedido.productos?.material === 'POLIETILENO' ? 'kilos' : 'millares';

      const entregaData = {
        pedidos_id: id,
        cantidad: pedido.cantidad,
        unidades: unidades,
        fecha_entrega: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase.from('entregas').insert([entregaData]);
      if (error) throw error;

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

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  return {
    pedidos,
    clientes,
    productos,
    vendedores,
    busqueda,
    setBusqueda,
    mostrarFormulario,
    setMostrarFormulario,
    mostrarDetalles,
    setMostrarDetalles,
    mostrarFormularioProducto,
    setMostrarFormularioProducto,
    cargando,
    cargandoExportar,
    showDatePicker,
    setShowDatePicker,
    aplicarIva,
    setAplicarIva,
    productoEditando,
    setProductoEditando,
    indexEditando,
    setIndexEditando,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    pedidoDetalleOriginal,
    setPedidoDetalleOriginal,
    productosTemporales,
    setProductosTemporales,
    modoEdicion,
    setModoEdicion,
    cambiosPendientes,
    setCambiosPendientes,
    editandoManual,
    setEditandoManual,
    form,
    setForm,
    detalleForm,
    setDetalleForm,
    productosSeleccionados,
    setProductosSeleccionados,
    resetDetalleForm,
    resetForm,
    calculateSubtotal,
    fetchPedidosDetalle,
    fetchPedidos,
    iniciarModoEdicion,
    cancelarEdicion,
    fetchClientes,
    fetchProductos,
    fetchVendedores,
    fetchDatos,
    handleChange,
    handleDetalleChange,
    handleDateChange,
    handleEditarProducto,
    handleCancelarEdicion,
    handleAñadirProductoTemporal,
    handleEliminarProductoTemporal,
    handleGuardar,
    handleEliminarProducto,
    handleAñadirProducto,
    guardarCambiosPedido,
    handleEditarProductoTemporal,
    handleEliminar,
    handleEntregar,
  };
};