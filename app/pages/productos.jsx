import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './styles/productos.styles';

export default function Productos() {
  const {
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
  } = useProductos();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Lista de Productos</Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          placeholder="Buscar por nombre"
          placeholderTextColor="#ccc"
          style={styles.inputBuscar}
          value={busqueda}
          onChangeText={setBusqueda}
          accessible
          accessibilityLabel="Buscar productos por nombre"
        />
      </View>

      <View style={styles.botoneraDerecha}>
        <TouchableOpacity
          style={[styles.botonAgregar, cargando && styles.disabledButton]}
          onPress={() => setMostrarFormulario(true)}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>➕ Agregar Producto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnExportarExcel, cargando && styles.disabledButton]}
          onPress={exportarExcel}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>📊 Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnExportarPDF, cargando && styles.disabledButton]}
          onPress={exportarPDF}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>📄 PDF</Text>
        </TouchableOpacity>
      </View>

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.formTitulo}>
            {form.id ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Material *:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.material}
                onValueChange={(val) => handleChange('material', val)}
                style={styles.picker}
                dropdownIconColor="#fff"
                accessible
                accessibilityLabel="Seleccionar material del producto"
              >
                {pedidoTypes.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            placeholder="Nombre *"
            style={styles.input}
            placeholderTextColor="#ccc"
            value={form.nombre}
            onChangeText={(text) => handleChange('nombre', text)}
            accessible
            accessibilityLabel="Nombre del producto"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Presentación *:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.presentacion}
                onValueChange={(val) => handleChange('presentacion', val)}
                style={styles.picker}
                dropdownIconColor="#fff"
                accessible
                accessibilityLabel="Seleccionar presentación del producto"
              >
                {(isCelofan ? presentacionesCelofan : presentacionesPolietileno).map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Tipo *:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.tipo}
                onValueChange={(val) => handleChange('tipo', val)}
                style={styles.picker}
                dropdownIconColor="#fff"
                accessible
                accessibilityLabel="Seleccionar tipo de producto"
              >
                {tipos.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          {isCelofan && (
            <>
              {form.presentacion === 'Gramaje' && (
                <TextInput
                  placeholder="Gramaje (g)"
                  style={styles.input}
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={form.gramaje}
                  onChangeText={(text) => handleChange('gramaje', text)}
                  accessible
                  accessibilityLabel="Gramaje del producto en gramos"
                />
              )}
              {form.presentacion === 'Micraje' && (
                <TextInput
                  placeholder="Micraje (um)"
                  style={styles.input}
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={form.micraje_um}
                  onChangeText={(text) => handleChange('micraje_um', text)}
                  accessible
                  accessibilityLabel="Micraje del producto en micrómetros"
                />
              )}
            </>
          )}

          {isPolietileno && (
            <TextInput
              placeholder="Micraje (um)"
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={form.micraje_um}
              onChangeText={(text) => handleChange('micraje_um', text)}
              accessible
              accessibilityLabel="Micraje del producto en micrómetros"
            />
          )}

          <View style={styles.row}>
            <TextInput
              placeholder="Ancho (cm)"
              style={[styles.input, styles.halfInput]}
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={form.ancho_cm}
              onChangeText={(text) => handleChange('ancho_cm', text)}
              accessible
              accessibilityLabel="Ancho del producto en centímetros"
            />
            <TextInput
              placeholder="Largo (cm)"
              style={[styles.input, styles.halfInput]}
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={form.largo_cm}
              onChangeText={(text) => handleChange('largo_cm', text)}
              accessible
              accessibilityLabel="Largo del producto en centímetros"
            />
          </View>

          <View style={styles.botonesForm}>
            <TouchableOpacity
              style={[styles.btnGuardar, cargando && styles.disabledButton]}
              onPress={handleGuardar}
              disabled={cargando}
            >
              <Text style={styles.botonTexto}>
                💾 {form.id ? 'Actualizar' : 'Guardar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnCancelar, cargando && styles.disabledButton]}
              onPress={resetForm}
              disabled={cargando}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {cargando && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}

      <ScrollView style={styles.lista}>
        {productosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
            </Text>
          </View>
        ) : (
          productosFiltrados.map((p) => {
            const especificaciones = renderProductInfo(p);
            return (
              <View key={p.id} style={styles.card}>
                <Text style={styles.nombre}>{p.nombre}</Text>
                <Text style={styles.info}>📦 {p.material}</Text>
                <Text style={styles.info}>🎯 {p.presentacion} - {p.tipo}</Text>
                {p.ancho_cm && p.largo_cm && (
                  <Text style={styles.info}>📏 {p.ancho_cm}cm x {p.largo_cm}cm</Text>
                )}
                {especificaciones && <Text style={styles.info}>⚖️ {especificaciones}</Text>}
                <View style={styles.botonesCard}>
                  <TouchableOpacity
                    onPress={() => handleEditar(p)}
                    style={[styles.btnEditar, cargando && styles.disabledButton]}
                    disabled={cargando}
                    accessible
                    accessibilityLabel={`Editar producto ${p.nombre}`}
                  >
                    <Text style={styles.botonTexto}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEliminar(p.id)}
                    style={[styles.btnEliminar, cargando && styles.disabledButton]}
                    disabled={cargando}
                    accessible
                    accessibilityLabel={`Eliminar producto ${p.nombre}`}
                  >
                    <Text style={styles.botonTexto}>🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}