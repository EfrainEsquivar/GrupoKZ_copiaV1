import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePagos } from '../hooks/usePagos';
import { styles } from './styles/Pagos.styles';

export default function Pagos() {
  const {
    pagos,
    notas,
    mostrarFormulario,
    setMostrarFormulario,
    editando,
    form,
    handleChange,
    resetForm,
    handleGuardar,
    handleEditar,
    handleEliminar,
  } = usePagos();

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarText}>Menú</Text>
        <TouchableOpacity><Text style={styles.sidebarItem}>Clientes</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Notas de Venta</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.sidebarItem}>Pagos</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Pagos</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => {
            resetForm();
            setMostrarFormulario(true);
          }}>
            <Text style={styles.saveButtonText}>Agregar Pago</Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <>
            <Text style={styles.label}>Nota de Venta</Text>
            <select
              style={styles.input}
              value={form.nota_venta_id || ''}
              onChange={(e) => handleChange('nota_venta_id', e.target.value)}
            >
              <option value="">Seleccione una nota</option>
              {notas.map(n => (
                <option key={n.id} value={n.id}>
                  {n.id} - {n.cliente}
                </option>
              ))}
            </select>

            <TextInput style={styles.input} placeholder="Fecha (YYYY-MM-DD)" value={form.fecha} onChangeText={(text) => handleChange('fecha', text)} />
            <TextInput style={styles.input} placeholder="Importe" value={form.importe} onChangeText={(text) => handleChange('importe', text)} />
            <TextInput style={styles.input} placeholder="Foto Comprobante (URL o ID)" value={form.foto_comprobante} onChangeText={(text) => handleChange('foto_comprobante', text)} />

            <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
              <Text style={styles.saveButtonText}>{editando ? 'Actualizar' : 'Guardar'} Pago</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {pagos.map((item) => {
          const nota = notas.find(n => n.id === item.nota_venta_id);
          return (
            <View key={item.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Fecha: {item.fecha}</Text>
                <Text style={styles.cardText}>Nota: {item.nota_venta_id} - {nota?.cliente || 'Desconocido'}</Text>
                <Text style={styles.cardText}>Importe: ${item.importe}</Text>
              </View>
              <View style={styles.cardButtons}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditar(item)}>
                  <Text style={styles.buttonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleEliminar(item.id)}>
                  <Text style={styles.buttonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}