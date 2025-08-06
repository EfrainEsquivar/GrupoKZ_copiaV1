import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../../../supabase';
import styles from '../../pages/styles/Pedidos.styles';
import { calcularPrecioUnitario, calcularKgPorMillar } from '../../constants/calculations';
import { LoadingComponent } from './UtilityComponents';

const PedidoDetails = ({
  pedido,
  onVolver,
  vendedores,
  productos,
  cargando,
  onEditarPedido,
  onEliminarPedido,
  onEntregar,
  onAbonar,
  productosSeleccionados,
  setProductosSeleccionados,
  fetchPedidosDetalle,
  handleAñadirProducto,
  handleEliminarProducto,
  mostrarFormularioProducto,
  setMostrarFormularioProducto,
  detalleForm,
  handleDetalleChange,
  resetDetalleForm,
  onEditarProducto,
  handleCancelarEdicion,
  productoEditando,
  indexEditando,
  modoEdicion,
  productosTemporales,
  cambiosPendientes,
  iniciarModoEdicion,
  cancelarEdicion,
  guardarCambiosPedido,
  handleAñadirProductoTemporal,
  handleEliminarProductoTemporal,
  handleEditarProductoTemporal,
}) => {
  // Calcular valores derivados sin hooks condicionales
  const vendedor = vendedores.find((v) => v.id === pedido?.notas_venta?.clientes?.vendedores_id) || null;
  const pagado = (pedido?.notas_venta?.pago_pendiente || 0) <= 0;

 const subtotalTotal = (() => {
  const productosActivos = modoEdicion ? productosTemporales : productosSeleccionados;
  return productosActivos.reduce((acc, p) => {
    const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
    return acc + (Number(subtotalLimpio) || 0);
  }, 0);
})();

const iva = subtotalTotal * 0.16;
const total = subtotalTotal + iva - (pedido?.notas_venta?.descuento || 0);







  // Cargar productos del pedido al montar
  useEffect(() => {
    if (pedido?.notas_venta_id) {
      fetchPedidosDetalle(pedido.notas_venta_id);
    }
  }, [pedido?.notas_venta_id, fetchPedidosDetalle]);

  // Efecto para mostrar detalles del producto cuando se selecciona uno
  // Agregar estado para controlar si el usuario está editando manualmente
const [editandoManual, setEditandoManual] = useState(false);

// Efecto para autocompletar datos y calcular importes
// Efecto para autocompletar datos y calcular importes
useEffect(() => {
  if (detalleForm.productos_id) {
    const producto = productos.find(p => p.id === Number(detalleForm.productos_id));
    if (producto) {
      // Rellenar campos automáticamente
      if (!detalleForm.ancho_cm && producto.ancho_cm) {
        handleDetalleChange('ancho_cm', producto.ancho_cm.toString());
      }
      if (!detalleForm.largo_cm && producto.largo_cm) {
        handleDetalleChange('largo_cm', producto.largo_cm.toString());
      }
      if (!detalleForm.micraje_um && producto.micraje_um) {
        handleDetalleChange('micraje_um', producto.micraje_um.toString());
      }
      
      // SIEMPRE establecer precio/kilo en 110
      handleDetalleChange('precio_unitario_sin_iva', '110.00');
      
      // Si hay cantidad, calcular todo automáticamente
      const cantidad = Number(detalleForm.cantidad) || 0;
      if (cantidad > 0) {
        const productoConValoresActuales = {
          ...producto,
          ancho_cm: Number(detalleForm.ancho_cm || producto.ancho_cm) || 0,
          largo_cm: Number(detalleForm.largo_cm || producto.largo_cm) || 0,
          micraje_um: Number(detalleForm.micraje_um || producto.micraje_um) || 0,
        };

        const precioPorKilo = 110;
        let precioUnitario = precioPorKilo;
        
        if (producto.material?.toUpperCase() === 'CELOFAN') {
          precioUnitario = calcularPrecioUnitario(productoConValoresActuales, precioPorKilo);
        }

        const precioConIva = precioUnitario * 1.16;
        const importeTotal = precioConIva * cantidad;
        const kgPorMillar = calcularKgPorMillar(productoConValoresActuales);

        // Actualizar todos los campos calculados
        handleDetalleChange('precio_unitario_con_iva', precioConIva.toFixed(2));
        handleDetalleChange('kg_por_millar', kgPorMillar.toFixed(2));
        handleDetalleChange('importe_total', importeTotal.toFixed(2));
      } else {
        // Si no hay cantidad, limpiar los campos calculados
        handleDetalleChange('precio_unitario_con_iva', '0.00');
        handleDetalleChange('kg_por_millar', '0.00');
        handleDetalleChange('importe_total', '0.00');
      }
    }
  }
}, [detalleForm.productos_id, detalleForm.cantidad, detalleForm.ancho_cm, detalleForm.largo_cm, detalleForm.micraje_um, productos, handleDetalleChange]);
  const exportarPDF = async () => {
    if (!pedido) return;
    
    try {
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

      const productosHTML = productosSeleccionados
        .map((producto) => {
          const prod = productos.find(p => p.id === producto.productos_id);
          const medidas = prod ? `${prod.ancho_cm}x${prod.largo_cm}cm ${prod.micraje_um}μm` : 'N/A';
          const precioFormateado = Number(producto.precio_unitario_con_iva?.replace(/[^0-9.-]+/g, '') || 0);
          const subtotalFormateado = Number(producto.subtotal?.replace(/[^0-9.-]+/g, '') || 0);
          
          return `
            <tr>
              <td>${producto.nombre || 'N/A'}</td>
              <td>${prod?.material || 'N/A'}</td>
              <td>${medidas}</td>
              <td>${producto.cantidad || 0} ${prod?.material === 'POLIETILENO' ? 'kg' : 'millares'}</td>
              <td>$${precioFormateado.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</td>
              <td>$${subtotalFormateado.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</td>
            </tr>
          `;
        })
        .join('');

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
                font-size: 28px;
              }
              .subtitle {
                color: #6b7280;
                font-size: 14px;
              }
              .info-section {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
              }
              .info-item {
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 8px;
              }
              .info-label {
                font-weight: bold;
                color: #374151;
                font-size: 12px;
              }
              .info-value {
                color: #1f2937;
                font-size: 14px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              th, td { 
                border: 1px solid #d1d5db; 
                padding: 12px 8px; 
                text-align: left; 
              }
              th { 
                background-color: #3b82f6; 
                color: white;
                font-weight: bold;
                font-size: 12px;
              }
              td {
                font-size: 11px;
              }
              .totals-section {
                background-color: #f3f4f6;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
              }
              .total-label {
                font-weight: bold;
              }
              .total-final {
                font-size: 18px;
                color: #059669;
                border-top: 2px solid #d1d5db;
                padding-top: 10px;
                margin-top: 10px;
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Comprobante de Pedido</h1>
              <div class="subtitle">Sistema de Gestión de Pedidos KZ</div>
            </div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Folio:</div>
                  <div class="info-value">${pedido.id || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Fecha:</div>
                  <div class="info-value">${pedido.notas_venta?.fecha || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Cliente:</div>
                  <div class="info-value">${pedido.notas_venta?.clientes?.nombre_contacto || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Empresa:</div>
                  <div class="info-value">${pedido.notas_venta?.clientes?.empresa || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Vendedor:</div>
                  <div class="info-value">${vendedor?.nombre || 'Sin asignar'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Número de Factura:</div>
                  <div class="info-value">${pedido.notas_venta?.numero_factura || 'Sin factura'}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Material</th>
                  <th>Medidas</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                ${productosHTML}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${(() => {
  const productosActivos = productosSeleccionados;
  return productosActivos.reduce((acc, p) => {
    const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
    return acc + (Number(subtotalLimpio) || 0);
  }, 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
})()}</span>
              </div>
              <div class="total-row">
                <span>IVA (16%):</span>
                <span>$${iva.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</span>
              </div>
              <div class="total-row">
                <span>Descuento:</span>
                <span>$${(pedido.notas_venta?.descuento || 0).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</span>
              </div>
              <div class="total-row total-final">
                <span><strong>Total:</strong></span>
                <span><strong>$${total.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</strong></span>
              </div>
              <div class="total-row">
                <span>Pago pendiente:</span>
                <span style="color: ${pagado ? '#059669' : '#dc2626'}">
                  $${(pedido.notas_venta?.pago_pendiente || 0).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            <div class="footer">
              <p>Generado el: ${fechaFormateada}</p>
              <p>Este documento es un comprobante de pedido interno</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF: ' + error.message);
    }
  };

  const inputTheme = {
    colors: {
      primary: '#3b82f6',
      text: '#ffffff',
      placeholder: '#ccc',
      background: '#1e293b',
    },
  };

  if (!pedido) {
    return <LoadingComponent text="Cargando detalles del pedido..." />;
  }

  const productoSeleccionado = productos.find(p => p.id === Number(detalleForm.productos_id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detalles del pedido #{pedido.id}</Text>
        <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
          <Ionicons name="arrow-back" size={16} color="#ffffff" />
          <Text style={styles.botonTexto}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detallesContainer} showsVerticalScrollIndicator={false}>
        {/* Información del pedido */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{pedido.notas_venta?.fecha || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Folio:</Text>
            <Text style={styles.infoValue}>{pedido.id || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{pedido.notas_venta?.clientes?.nombre_contacto || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Empresa:</Text>
            <Text style={styles.infoValue}>{pedido.notas_venta?.clientes?.empresa || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vendedor:</Text>
            <Text style={styles.infoValue}>{vendedor?.nombre || 'Sin asignar'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Días de crédito:</Text>
            <Text style={styles.infoValue}>{pedido.notas_venta?.clientes?.dias_credito || 0} días</Text>
          </View>
        </View>

     {/* Sección de productos */}
<View style={styles.productosSection}>
<View style={styles.productosHeader}>
  <Text style={styles.subTitle}>Productos del Pedido</Text>
  <View style={styles.botonesProductosHeader}>
    <TouchableOpacity
      style={styles.btnAnadirProducto}
      onPress={() => {
        if (!modoEdicion) {
          iniciarModoEdicion();
        }
        setMostrarFormularioProducto(true);
      }}
      disabled={cargando}
    >
      <Ionicons name="add" size={16} color="#ffffff" />
      <Text style={styles.btnAnadirTexto}>Añadir</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.btnGuardar, { opacity: cambiosPendientes ? 1 : 0.6 }]}
      onPress={() => {
        if (!modoEdicion) {
          iniciarModoEdicion();
        }
        guardarCambiosPedido();
      }}
      disabled={cargando || !cambiosPendientes}
    >
      <Ionicons name="checkmark" size={16} color="#ffffff" />
      <Text style={styles.btnAnadirTexto}>Guardar</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.btnCancelarProducto}
      onPress={cancelarEdicion}
      disabled={cargando}
    >
      <Ionicons name="close" size={16} color="#ffffff" />
      <Text style={styles.btnAnadirTexto}>Cancelar</Text>
    </TouchableOpacity>
  </View>
</View>

  {/* Mostrar mensaje si hay cambios pendientes */}
  {cambiosPendientes && (
    <View style={styles.cambiosPendientesAlert}>
      <Ionicons name="warning" size={16} color="#f59e0b" />
      <Text style={styles.cambiosPendientesText}>
        Tienes cambios sin guardar. Presiona "Guardar" para confirmar.
      </Text>
    </View>
  )}

  {/* Formulario para añadir/editar productos (solo en modo edición) */}


          {/* Formulario para añadir/editar productos */}
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
  onValueChange={(value) => {
    handleDetalleChange('productos_id', value);
    // Establecer precio/kilo inmediatamente
    if (value) {
      setTimeout(() => {
        handleDetalleChange('precio_unitario_sin_iva', '110.00');
      }, 0);
    }
  }}
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
                    onChangeText={(text) => handleDetalleChange('cantidad', text)}
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
{productoSeleccionado && (
  <View style={styles.productoInfoContainer}>
    <Text style={styles.productoInfoTitle}>Información del Producto (Editable)</Text>
    
    <View style={styles.row2}>
      <View style={styles.col2}>
        <PaperInput
          label="Ancho (cm)"
          value={detalleForm.ancho_cm || productoSeleccionado.ancho_cm?.toString() || ''}
          onChangeText={(text) => handleDetalleChange('ancho_cm', text)}
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
  value={detalleForm.largo_cm || productoSeleccionado.largo_cm?.toString() || ''}
  onChangeText={(text) => {
    setEditandoManual(true); // Marcar como edición manual
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
  value={detalleForm.micraje_um || productoSeleccionado.micraje_um?.toString() || ''}
  onChangeText={(text) => {
    setEditandoManual(true); // Marcar como edición manual
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
    setEditandoManual(true); // Marcar como edición manual
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
    setEditandoManual(true); // Marcar como edición manual
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
                  onPress={handleAñadirProductoTemporal} 
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

          {/* Tabla de productos */}
          {productosSeleccionados.length > 0 ? (
            <View style={styles.tablaProductos}>
              <View style={styles.tablaHeader}>
                <Text style={[styles.tablaHeaderText, { flex: 3 }]}>Producto</Text>
                <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Cant.</Text>
                <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Precio</Text>
                <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Total</Text>
                <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Estado</Text>
                <Text style={[styles.tablaHeaderText, { flex: 1 }]}>Acc.</Text>
              </View>

              {productosSeleccionados.map((producto, index) => {
                const prod = productos.find(p => p.id === producto.productos_id);
                const tieneEntrega = producto.entregas && producto.entregas.length > 0;
                const precioFormateado = Number(producto.precio_unitario_con_iva?.replace(/[^0-9.-]+/g, '') || 0);
                const subtotalFormateado = Number(producto.subtotal?.replace(/[^0-9.-]+/g, '') || 0);
                
                return (
                  <View key={`${producto.productos_id}-${index}`} style={styles.tablaFila}>
                    <View style={[styles.tablaCelda, { flex: 3 }]}>
                      <Text style={styles.tablaCeldaTexto} numberOfLines={2}>
                        {producto.nombre || 'N/A'}
                      </Text>
                      {prod && (
                        <Text style={styles.materialSubtext}>
                          {prod.material}
                        </Text>
                      )}
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
                    
                    <View style={[styles.tablaCelda, { flex: 1, alignItems: 'center' }]}>
                      <View
                        style={[
                          styles.estatusPill,
                          tieneEntrega ? styles.estatusEntregado : styles.estatusPendiente,
                        ]}
                      >
                        <Text style={styles.estatusTexto}>
                          {tieneEntrega ? 'OK' : 'Pend'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.tablaCelda, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }]}>



<TouchableOpacity
  style={styles.accionBtn}
  onPress={() => {
    if (!modoEdicion) {
      iniciarModoEdicion();
    }
    handleEditarProductoTemporal(producto, index);
  }}
  disabled={cargando}
>
  <Ionicons name="pencil" size={12} color="#6b7280" />
</TouchableOpacity>
                      
  <TouchableOpacity
  style={styles.accionBtnEliminar}
  onPress={() => {
    if (!modoEdicion) {
      iniciarModoEdicion();
    }
    handleEliminarProductoTemporal(index);
  }}
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

     {/* Resumen financiero */}
<View style={styles.resumenContainer}>
  <View style={styles.resumenIzquierda}>
    <View style={styles.resumenFila}>
      <Text style={styles.resumenLabel}>Total parcial:</Text>
      <Text style={styles.resumenValor}>
        ${(() => {
          const productosActivos = modoEdicion ? productosTemporales : productosSeleccionados;
          const subtotal = productosActivos.reduce((acc, p) => {
            const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
            return acc + (Number(subtotalLimpio) || 0);
          }, 0);
          return subtotal.toLocaleString('es-MX', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        })()}
      </Text>
    </View>
    <View style={styles.resumenFila}>
      <Text style={styles.ivaLabel}>IVA (16%):</Text>
      <Text style={styles.ivaValor}>
        ${(() => {
          const productosActivos = modoEdicion ? productosTemporales : productosSeleccionados;
          const subtotal = productosActivos.reduce((acc, p) => {
            const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
            return acc + (Number(subtotalLimpio) || 0);
          }, 0);
          const iva = subtotal * 0.16;
          return iva.toLocaleString('es-MX', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        })()}
      </Text>
    </View>
    <View style={styles.resumenFila}>
      <Text style={styles.resumenLabel}>Descuento:</Text>
      <Text style={styles.resumenValor}>
        ${(pedido?.notas_venta?.descuento || 0).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </View>
    <View style={[styles.resumenFila, { borderTopWidth: 1, borderTopColor: '#4b5563', paddingTop: 8, marginTop: 8 }]}>
      <Text style={styles.totalLabel}>Total:</Text>
      <Text style={styles.totalValor}>
        ${(() => {
          const productosActivos = modoEdicion ? productosTemporales : productosSeleccionados;
          const subtotal = productosActivos.reduce((acc, p) => {
            const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
            return acc + (Number(subtotalLimpio) || 0);
          }, 0);
          const iva = subtotal * 0.16;
          const descuento = pedido?.notas_venta?.descuento || 0;
          const total = subtotal + iva - descuento;
          return total.toLocaleString('es-MX', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        })()}
      </Text>
    </View>
    <View style={styles.resumenFila}>
      <Text style={styles.resumenLabel}>Pago pendiente:</Text>
      <Text style={[styles.resumenValor, { color: pagado ? '#22c55e' : '#ef4444' }]}>
        ${(pedido?.notas_venta?.pago_pendiente || 0).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </View>
  </View>

  <View style={styles.resumenDerecha}>
    <View style={styles.estadoIndicadores}>
      <View style={styles.estadoFila}>
        <View style={[styles.estadoBarra, { backgroundColor: pagado ? '#22c55e' : '#6b7280' }]} />
        <Text style={styles.estadoTexto}>Depósitos</Text>
      </View>
      <View style={styles.estadoFila}>
        <View style={[styles.estadoBarra, { backgroundColor: pedido?.entregas?.length > 0 ? '#3b82f6' : '#6b7280' }]} />
        <Text style={styles.estadoTexto}>Entrega</Text>
      </View>
      <View style={styles.estadoFila}>
        <View style={[styles.estadoBarra, { backgroundColor: '#eab308' }]} />
        <Text style={styles.estadoTexto}>Crédito</Text>
      </View>
    </View>

    <View style={styles.botonesEstado}>
      <TouchableOpacity 
        style={[styles.btnEstado, styles.btnAbonar]} 
        onPress={() => onAbonar(pedido?.id)} 
        disabled={cargando || pagado}
      >
        <Ionicons name="cash" size={14} color="#ffffff" />
        <Text style={styles.btnEstadoTexto}>Abonar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btnEstado, pagado ? styles.btnPagado : styles.btnSinPagar]} 
        disabled={true}
      >
        <Ionicons name={pagado ? "checkmark-circle" : "time"} size={14} color="#ffffff" />
        <Text style={styles.btnEstadoTexto}>{pagado ? 'Pagado' : 'Pendiente'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnEstado, pedido?.entregas?.length > 0 ? styles.btnEntregado : styles.btnPendienteEntrega]}
        onPress={() => !pedido?.entregas?.length && onEntregar(pedido?.id)}
        disabled={cargando || pedido?.entregas?.length > 0}
      >
        <Ionicons name={pedido?.entregas?.length > 0 ? "cube" : "cube-outline"} size={14} color="#ffffff" />
        <Text style={styles.btnEstadoTexto}>
          {pedido?.entregas?.length > 0 ? 'Entregado' : 'Entregar'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

        {/* Botones de acción */}
        <View style={styles.botonesAcciones}>
          <TouchableOpacity
            style={styles.btnImprimir}
            onPress={exportarPDF}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="print" size={16} color="#ffffff" />
                <Text style={styles.btnImprimirTexto}>Imprimir</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.btnEditarPedido}
            onPress={() => onEditarPedido(pedido)}
            disabled={cargando}
          >
            <Ionicons name="settings" size={16} color="#ffffff" />
            <Text style={styles.botonTexto}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.btnEliminarPedido}
            onPress={() => onEliminarPedido(pedido.id)}
            disabled={cargando}
          >
            <Ionicons name="trash" size={16} color="#ffffff" />
            <Text style={styles.botonTexto}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default PedidoDetails;