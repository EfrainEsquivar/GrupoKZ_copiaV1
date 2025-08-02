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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase';

// Funciones de cálculo mejoradas
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

// Componente de Loading
const LoadingComponent = ({ text = "Cargando..." }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

// Componente de Estado vacío
const EmptyState = ({ message, hasSearch = false }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="document-text-outline" size={64} color="#6b7280" />
    <Text style={styles.emptyText}>
      {hasSearch ? 'No se encontraron pedidos con esa búsqueda' : message}
    </Text>
  </View>
);

// Componente de Paginación
const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => (
  <View style={styles.paginationContainer}>
    <TouchableOpacity
      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
      onPress={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#6b7280' : '#ffffff'} />
    </TouchableOpacity>
    <View style={styles.paginationInfo}>
      <Text style={styles.paginationText}>
        Página {currentPage} de {totalPages}
      </Text>
      <Text style={styles.paginationSubtext}>
        {totalItems} registros
      </Text>
    </View>
    <TouchableOpacity
      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
      onPress={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#6b7280' : '#ffffff'} />
    </TouchableOpacity>
  </View>
);

// Componente PedidoDetails (sin cambios, ya que el problema está en la lista de pedidos)
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
}) => {
  // Calcular valores derivados sin hooks condicionales
  const vendedor = vendedores.find((v) => v.id === pedido?.notas_venta?.clientes?.vendedores_id) || null;
  const pagado = (pedido?.notas_venta?.pago_pendiente || 0) <= 0;
  const subtotalTotal = productosSeleccionados.reduce((acc, p) => {
    const subtotalLimpio = (p.subtotal || '0').toString().replace(/[^0-9.-]+/g, '');
    return acc + (Number(subtotalLimpio) || 0);
  }, 0);
  const iva = subtotalTotal * 0.16;
  const total = subtotalTotal + iva - (pedido?.notas_venta?.descuento || 0);

  // Cargar productos del pedido al montar
  useEffect(() => {
    if (pedido?.notas_venta_id) {
      fetchPedidosDetalle(pedido.notas_venta_id);
    }
  }, [pedido?.notas_venta_id, fetchPedidosDetalle]);

  // Efecto para mostrar detalles del producto cuando se selecciona uno
  useEffect(() => {
    if (detalleForm.productos_id) {
      const producto = productos.find(p => p.id === Number(detalleForm.productos_id));
      if (producto) {
        const cantidad = Number(detalleForm.cantidad) || 0;
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
        const precioUnitario = material === 'CELOFAN'
          ? calcularPrecioUnitario(producto, precioPorKilo)
          : precioPorKilo;
        const precioConIva = precioUnitario * 1.16;
        const importeTotal = cantidad > 0 ? precioConIva * cantidad : 0;
        const kgPorMillar = calcularKgPorMillar(producto);
        handleDetalleChange('precio_unitario_sin_iva', precioUnitario.toFixed(2));
        handleDetalleChange('precio_unitario_con_iva', precioConIva.toFixed(2));
        handleDetalleChange('kg_por_millar', kgPorMillar.toFixed(2));
        handleDetalleChange('importe_total', importeTotal.toFixed(2));
      }
    }
  }, [detalleForm.productos_id, detalleForm.cantidad, productos, handleDetalleChange]);

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
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.4; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
              h1 { color: #1f2937; margin-bottom: 10px; font-size: 28px; }
              .subtitle { color: #6b7280; font-size: 14px; }
              .info-section { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .info-item { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
              .info-label { font-weight: bold; color: #374151; font-size: 12px; }
              .info-value { color: #1f2937; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              th, td { border: 1px solid #d1d5db; padding: 12px 8px; text-align: left; }
              th { background-color: #3b82f6; color: white; font-weight: bold; font-size: 12px; }
              td { font-size: 11px; }
              .totals-section { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .total-label { font-weight: bold; }
              .total-final { font-size: 18px; color: #059669; border-top: 2px solid #d1d5db; padding-top: 10px; margin-top: 10px; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
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
                <span>$${subtotalTotal.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</span>
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
        <View style={styles.productosSection}>
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
              {productoSeleccionado && (
                <View style={styles.productoInfoContainer}>
                  <Text style={styles.productoInfoTitle}>Información del Producto</Text>
                  <View style={styles.productoInfoGrid}>
                    <View style={styles.productoInfoItem}>
                      <Text style={styles.productoInfoLabel}>Medidas:</Text>
                      <Text style={styles.productoInfoValue}>
                        {productoSeleccionado.ancho_cm}x{productoSeleccionado.largo_cm}cm
                      </Text>
                    </View>
                    <View style={styles.productoInfoItem}>
                      <Text style={styles.productoInfoLabel}>Micraje:</Text>
                      <Text style={styles.productoInfoValue}>
                        {productoSeleccionado.micraje_um}μm
                      </Text>
                    </View>
                    <View style={styles.productoInfoItem}>
                      <Text style={styles.productoInfoLabel}>Precio/Kilo:</Text>
                      <Text style={styles.productoInfoValue}>
                        ${detalleForm.precio_unitario_sin_iva || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.productoInfoItem}>
                      <Text style={styles.productoInfoLabel}>Precio con IVA:</Text>
                      <Text style={styles.productoInfoValue}>
                        ${detalleForm.precio_unitario_con_iva || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.productoInfoItem}>
                      <Text style={styles.productoInfoLabel}>Kg por millar:</Text>
                      <Text style={styles.productoInfoValue}>
                        ${detalleForm.kg_por_millar || '0.00'}
                      </Text>
                    </View>
                    <View style={[styles.productoInfoItem, styles.productoInfoTotal]}>
                      <Text style={styles.productoInfoLabel}>Importe Total:</Text>
                      <Text style={[styles.productoInfoValue, styles.productoInfoTotalValue]}>
                        ${detalleForm.importe_total || '0.00'}
                      </Text>
                    </View>
                  </View>
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
                        onPress={() => onEditarProducto(producto, index)}
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
        <View style={styles.resumenContainer}>
          <View style={styles.resumenIzquierda}>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Subtotal:</Text>
              <Text style={styles.resumenValor}>
                ${subtotalTotal.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.ivaLabel}>IVA (16%):</Text>
              <Text style={styles.ivaValor}>
                ${iva.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Descuento:</Text>
              <Text style={styles.resumenValor}>
                ${(pedido.notas_venta?.descuento || 0).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={[styles.resumenFila, { borderTopWidth: 1, borderTopColor: '#4b5563', paddingTop: 8, marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValor}>
                ${total.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Pago pendiente:</Text>
              <Text style={[styles.resumenValor, { color: pagado ? '#22c55e' : '#ef4444' }]}>
                ${(pedido.notas_venta?.pago_pendiente || 0).toLocaleString('es-MX', {
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
                <View style={[styles.estadoBarra, { backgroundColor: pedido.entregas?.length > 0 ? '#3b82f6' : '#6b7280' }]} />
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
                onPress={() => onAbonar(pedido.id)}
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
                style={[styles.btnEstado, pedido.entregas?.length > 0 ? styles.btnEntregado : styles.btnPendienteEntrega]}
                onPress={() => !pedido.entregas?.length && onEntregar(pedido.id)}
                disabled={cargando || pedido.entregas?.length > 0}
              >
                <Ionicons name={pedido.entregas?.length > 0 ? "cube" : "cube-outline"} size={14} color="#ffffff" />
                <Text style={styles.btnEstadoTexto}>
                  {pedido.entregas?.length > 0 ? 'Entregado' : 'Entregar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

// Componente principal Pedidos
export default function Pedidos() {
  // Estados principales
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
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Funciones con useCallback
  const resetDetalleForm = useCallback(() => {
    setDetalleForm({
      productos_id: '',
      cantidad: '',
      precio_unitario_sin_iva: '',
      precio_unitario_con_iva: '',
      kg_por_millar: '',
      importe_total: '',
    });
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
      setCargando(true);
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
      console.log('Pedidos fetched:', pedidosProcesados); // Debugging
      setPedidos(pedidosProcesados);
    } catch (error) {
      console.error('Error en fetchPedidos:', error);
      Alert.alert('Error', 'Error al cargar los pedidos: ' + error.message);
    } finally {
      setCargando(false);
    }
  }, []);

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
      Alert.alert('Error', 'Error al cargar clientes');
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
      Alert.alert('Error', 'Error al cargar productos');
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
      Alert.alert('Error', 'Error al cargar vendedores');
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

  const handleEliminarProducto = useCallback((index) => {
    setProductosSeleccionados((prev) => prev.filter((_, i) => i !== index));
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
      if (!id) {
        const { data: notaData, error: notaError } = await supabase
          .from('notas_venta')
          .insert([notaVentaData])
          .select('id')
          .single();
        if (notaError) throw notaError;
        notaVentaId = notaData.id;
      } else {
        notaVentaId = form.notas_venta_id;
        const { error: notaUpdateError } = await supabase
          .from('notas_venta')
          .update(notaVentaData)
          .eq('id', notaVentaId);
        if (notaUpdateError) throw notaUpdateError;
        await supabase
          .from('pedidos')
          .delete()
          .eq('notas_venta_id', notaVentaId);
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
      if (pedidosError) throw pedidosError;
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
      Alert.alert('Éxito', id ? 'Pedido actualizado correctamente' : 'Pedido creado correctamente');
      if (pedidoDetalleOriginal) {
        await fetchPedidos();
        const pedidoActualizado = pedidos.find(p => p.id === pedidoDetalleOriginal.id);
        if (pedidoActualizado) {
          setMostrarDetalles(pedidoActualizado);
        }
        setPedidoDetalleOriginal(null);
      }
      resetForm();
      await fetchPedidos();
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      Alert.alert('Error', 'Error al guardar el pedido: ' + (error.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  }, [form, productosSeleccionados, aplicarIva, clientes, resetForm, fetchPedidos, pedidoDetalleOriginal, pedidos]);

  const handleEliminar = useCallback(async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este pedido completo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const pedido = pedidos.find((p) => p.id === id);
              if (!pedido) throw new Error('Pedido no encontrado');
              const { data: pedidosNota } = await supabase
                .from('pedidos')
                .select('id')
                .eq('notas_venta_id', pedido.notas_venta_id);
              for (const ped of pedidosNota || []) {
                await supabase.from('entregas').delete().eq('pedidos_id', ped.id);
              }
              await supabase
                .from('pedidos')
                .delete()
                .eq('notas_venta_id', pedido.notas_venta_id);
              await supabase
                .from('pagos')
                .delete()
                .eq('notas_venta_id', pedido.notas_venta_id);
              await supabase
                .from('notas_venta')
                .delete()
                .eq('id', pedido.notas_venta_id);
              Alert.alert('Éxito', 'Pedido eliminado correctamente');
              await fetchPedidos();
            } catch (error) {
              console.error('Error al eliminar pedido:', error);
              Alert.alert('Error', 'Error al eliminar el pedido: ' + error.message);
            } finally {
              setCargando(false);
            }
          },
        },
      ]
    );
  }, [pedidos, fetchPedidos]);

  const handleEntregar = useCallback(async (id) => {
    try {
      setCargando(true);
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
    if (mostrarDetalles) {
      setPedidoDetalleOriginal(pedido);
    }
    setForm({
      id: pedido.id,
      notas_venta_id: pedido.notas_venta_id,
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
    fetchPedidosDetalle(pedido.notas_venta_id);
    setAplicarIva((pedido.notas_venta.iva || 0) > 0);
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
    if (mostrarFormulario && pedidoDetalleOriginal) {
      setMostrarDetalles(pedidoDetalleOriginal);
      setPedidoDetalleOriginal(null);
      resetForm();
    } else {
      setMostrarDetalles(null);
      setMostrarFormularioProducto(false);
      setProductosSeleccionados([]);
      setProductoEditando(null);
      setIndexEditando(null);
      resetDetalleForm();
    }
  }, [mostrarFormulario, pedidoDetalleOriginal, resetForm, resetDetalleForm]);

  const exportarExcel = useCallback(async () => {
    const pedidosFiltrados = pedidos.filter((p) => {
      if (!busqueda.trim()) return true;
      const busquedaLower = busqueda.toLowerCase().trim();
      const searchableText = [
        p.productos?.nombre || '',
        p.notas_venta?.clientes?.nombre_contacto || '',
        p.notas_venta?.clientes?.empresa || '',
        p.id?.toString() || '',
        p.notas_venta?.numero_factura || '',
        p.productos?.material || '',
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
      if (!busqueda.trim()) return true;
      const busquedaLower = busqueda.toLowerCase().trim();
      const searchableText = [
        p.productos?.nombre || '',
        p.notas_venta?.clientes?.nombre_contacto || '',
        p.notas_venta?.clientes?.empresa || '',
        p.id?.toString() || '',
        p.notas_venta?.numero_factura || '',
        p.productos?.material || '',
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
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.4; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
              h1 { color: #1f2937; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background-color: #3b82f6; color: white; font-weight: bold; }
              .total { font-weight: bold; margin-top: 20px; text-align: center; background-color: #f3f4f6; padding: 20px; border-radius: 8px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; }
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

  // Filtrado de pedidos
  const pedidosFiltrados = (() => {
    if (!busqueda.trim()) return pedidos;
    const busquedaLower = busqueda.toLowerCase().trim();
    return pedidos.filter((p) => {
      const searchableText = [
        p.productos?.nombre || '',
        p.notas_venta?.clientes?.nombre_contacto || '',
        p.notas
