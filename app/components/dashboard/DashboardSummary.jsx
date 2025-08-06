import { FontAwesome5 } from '@expo/vector-icons';
import { Dimensions, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BarChart, PieChart } from 'react-native-chart-kit';

export const DashboardSummary = ({ styles, cargando, error, metricas }) => (
  <Animatable.View animation="fadeInUp" duration={800} style={styles.summaryContainer}>
    <Text style={styles.summaryTitle}>📊 Resumen General</Text>
    <Text style={styles.dateTimeText}>
      Actualizado: {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })} - {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </Text>

    {cargando ? (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando datos financieros...</Text>
      </View>
    ) : error ? (
      <Text style={styles.errorText}>{error}</Text>
    ) : (
      <>
        <View style={styles.metricasContainer}>
          <Animatable.View animation="zoomIn" delay={300} style={styles.card}>
            <FontAwesome5 name="shopping-cart" size={48} color="#60a5fa" />
            <Text style={styles.cardTitle}>Total de Pedidos</Text>
            <Text style={styles.cardValue}>
              {metricas.totalPedidos === 0 ? 'Cero' : metricas.totalPedidos}
            </Text>
          </Animatable.View>
          <Animatable.View animation="zoomIn" delay={400} style={styles.card}>
            <FontAwesome5 name="wallet" size={48} color="#ef4444" />
            <Text style={styles.cardTitle}>Cuentas por Cobrar</Text>
            <Text style={styles.cardValue}>
              {metricas.cuentasPorCobrar === 0 ? 'Cero' : `$${metricas.cuentasPorCobrar.toFixed(2)}`}
            </Text>
          </Animatable.View>
          <Animatable.View animation="zoomIn" delay={500} style={styles.card}>
            <FontAwesome5 name="money-bill" size={48} color="#f59e0b" />
            <Text style={styles.cardTitle}>Cuentas por Pagar</Text>
            <Text style={styles.cardValue}>
              {metricas.cuentasPorPagar === 0 ? 'Cero' : `$${metricas.cuentasPorPagar.toFixed(2)}`}
            </Text>
          </Animatable.View>
          <Animatable.View animation="zoomIn" delay={600} style={styles.card}>
            <FontAwesome5 name="box-open" size={48} color="#22c55e" />
            <Text style={styles.cardTitle}>Inventario de Celofán</Text>
            <Text style={styles.cardValue}>
              {metricas.inventarioCelofan === 0 ? 'Cero' : `${metricas.inventarioCelofan} millares`}
            </Text>
          </Animatable.View>
          <Animatable.View animation="zoomIn" delay={700} style={styles.card}>
            <FontAwesome5 name="box-open" size={48} color="#22c55e" />
            <Text style={styles.cardTitle}>Inventario de Polietileno</Text>
            <Text style={styles.cardValue}>
              {metricas.inventarioPolietileno === 0 ? 'Cero' : `${metricas.inventarioPolietileno} kilos`}
            </Text>
          </Animatable.View>
        </View>

        <Animatable.View animation="fadeInUp" delay={800} style={styles.chartContainer}>
          <BarChart
            data={{
              labels: ['Pendiente', 'Completado', 'Cancelado'],
              datasets: [{
                data: [
                  metricas.pedidosPorEstado.Pendiente || 0,
                  metricas.pedidosPorEstado.Completado || 0,
                  metricas.pedidosPorEstado.Cancelado || 0,
                ],
                colors: [
                  (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                ],
              }],
            }}
            width={Dimensions.get('window').width - 80}
            height={240}
            chartConfig={{
              backgroundColor: '#1e293b',
              backgroundGradientFrom: '#1e293b',
              backgroundGradientTo: '#1e293b',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              barPercentage: 0.3,
              propsForLabels: { fontSize: 12, fontWeight: '600' },
            }}
            style={{ borderRadius: 16 }}
            withCustomBarColorFromData
            flatColor
          />
          <Text style={styles.chartTitle}>Estado de Pedidos</Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={1000} style={styles.chartContainer}>
          <PieChart
            data={[
              {
                name: 'Cuentas por Cobrar',
                population: metricas.cuentasPorCobrar || 0,
                color: '#ef4444',
                legendFontColor: '#fff',
                legendFontSize: 12,
              },
              {
                name: 'Cuentas por Pagar',
                population: metricas.cuentasPorPagar || 0,
                color: '#f59e0b',
                legendFontColor: '#fff',
                legendFontSize: 12,
              },
            ]}
            width={Dimensions.get('window').width - 80}
            height={240}
            chartConfig={{
              backgroundColor: '#1e293b',
              backgroundGradientFrom: '#1e293b',
              backgroundGradientTo: '#1e293b',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForLabels: { fontSize: 12, fontWeight: '600' },
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
          />
          <Text style={styles.chartTitle}>Balance Financiero: Cobrar vs Pagar</Text>
        </Animatable.View>
      </>
    )}
  </Animatable.View>
);