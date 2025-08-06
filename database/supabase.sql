-- =====================================================
-- SISTEMA DE GESTIÓN INDUSTRIAL - ESTRUCTURA DE BASE DE DATOS
-- =====================================================

-- Creación de tipos de datos personalizados (ENUMS)
CREATE TYPE material_type AS ENUM ('celofan', 'polietileno');
CREATE TYPE presentacion_type AS ENUM ('rollo', 'bobina', 'lamina');
CREATE TYPE tipo_type AS ENUM ('industrial', 'alimentario', 'farmaceutico');
CREATE TYPE turno_type AS ENUM ('matutino', 'vespertino', 'nocturno');
CREATE TYPE movimiento_type AS ENUM ('entrada', 'salida');
CREATE TYPE rol_type AS ENUM ('admin', 'operador', 'vendedor', 'supervisor');

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de vendedores
CREATE TABLE public.vendedores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

-- Tabla de usuarios del sistema
CREATE TABLE public.usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    rol rol_type,
    email VARCHAR UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    puesto TEXT,
    contraseña VARCHAR,
    auth_uid UUID,
    CONSTRAINT usuarios_auth_uid_fkey FOREIGN KEY (auth_uid) REFERENCES auth.users(id)
);

-- Tabla de productos
CREATE TABLE public.productos (
    id SERIAL PRIMARY KEY,
    material material_type,
    presentacion presentacion_type,
    tipo tipo_type,
    ancho_cm DOUBLE PRECISION CHECK (ancho_cm >= 0),
    largo_cm DOUBLE PRECISION CHECK (largo_cm >= 0),
    micraje_um NUMERIC CHECK (micraje_um >= 0),
    nombre TEXT
);

-- Tabla de clientes
CREATE TABLE public.clientes (
    id SERIAL PRIMARY KEY,
    nombre_contacto TEXT,
    empresa TEXT,
    correo TEXT,
    telefono TEXT,
    direccion TEXT,
    dias_credito NUMERIC CHECK (dias_credito >= 0),
    estado BOOLEAN,
    vendedores_id NUMERIC,
    CONSTRAINT clientes_vendedores_id_fkey FOREIGN KEY (vendedores_id) REFERENCES public.vendedores(id)
);

-- =====================================================
-- TABLAS DE PRODUCCIÓN
-- =====================================================

-- Producción de celofán
CREATE TABLE public.produccion_celofan (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    turno turno_type NOT NULL,
    maquina TEXT,
    productos_id NUMERIC NOT NULL,
    millares NUMERIC CHECK (millares >= 0),
    operador TEXT,
    CONSTRAINT produccion_celofan_productos_id_fkey FOREIGN KEY (productos_id) REFERENCES public.productos(id)
);

-- Producción de polietileno
CREATE TABLE public.produccion_polietileno (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    turno turno_type NOT NULL,
    maquina TEXT,
    productos_id NUMERIC,
    kilos NUMERIC CHECK (kilos >= 0),
    operador TEXT,
    CONSTRAINT produccion_polietileno_productos_id_fkey FOREIGN KEY (productos_id) REFERENCES public.productos(id)
);

-- =====================================================
-- TABLAS DE VENTAS
-- =====================================================

-- Notas de venta (facturas)
CREATE TABLE public.notas_venta (
    id SERIAL PRIMARY KEY,
    fecha DATE,
    clientes_id NUMERIC,
    descuento NUMERIC CHECK (descuento >= 0),
    subtotal NUMERIC CHECK (subtotal >= 0),
    iva NUMERIC CHECK (iva >= 0),
    total NUMERIC CHECK (total >= 0),
    numero_factura VARCHAR,
    CONSTRAINT notas_venta_clientes_id_fkey FOREIGN KEY (clientes_id) REFERENCES public.clientes(id)
);

-- Pedidos (detalles de las notas de venta)
CREATE TABLE public.pedidos (
    id SERIAL PRIMARY KEY,
    notas_venta_id NUMERIC,
    productos_id NUMERIC,
    cantidad DOUBLE PRECISION CHECK (cantidad > 0),
    precio_kilo_venta NUMERIC,
    precio_unitario_venta DOUBLE PRECISION,
    precio_iva DOUBLE PRECISION,
    importe DOUBLE PRECISION,
    CONSTRAINT pedidos_notas_venta_id_fkey FOREIGN KEY (notas_venta_id) REFERENCES public.notas_venta(id),
    CONSTRAINT pedidos_productos_id_fkey FOREIGN KEY (productos_id) REFERENCES public.productos(id)
);

-- Entregas
CREATE TABLE public.entregas (
    id SERIAL PRIMARY KEY,
    cantidad NUMERIC CHECK (cantidad >= 0),
    unidades TEXT,
    fecha_entrega DATE,
    pedidos_id NUMERIC,
    CONSTRAINT entregas_pedidos_id_fkey FOREIGN KEY (pedidos_id) REFERENCES public.pedidos(id)
);

-- =====================================================
-- TABLAS DE ALMACÉN
-- =====================================================

-- Movimientos de almacén - Celofán
CREATE TABLE public.almacen_celofan_movimientos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    producto_id NUMERIC,
    millares INTEGER CHECK (millares >= 0),
    movimiento movimiento_type NOT NULL,
    produccion_id NUMERIC,
    entrega_id NUMERIC,
    CONSTRAINT almacen_celofan_movimientos_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id),
    CONSTRAINT almacen_celofan_movimientos_produccion_id_fkey FOREIGN KEY (produccion_id) REFERENCES public.produccion_celofan(id)
);

-- Movimientos de almacén - Polietileno
CREATE TABLE public.almacen_polietileno_movimientos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    producto_id NUMERIC,
    kilos NUMERIC CHECK (kilos >= 0),
    movimiento movimiento_type NOT NULL,
    produccion_id NUMERIC,
    entrega_id NUMERIC,
    CONSTRAINT almacen_polietileno_movimientos_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id),
    CONSTRAINT almacen_polietileno_movimientos_produccion_id_fkey FOREIGN KEY (produccion_id) REFERENCES public.produccion_polietileno(id)
);

-- =====================================================
-- TABLAS FINANCIERAS
-- =====================================================

-- Pagos
CREATE TABLE public.pagos (
    id SERIAL PRIMARY KEY,
    notas_venta_id NUMERIC,
    fecha DATE NOT NULL,
    importe NUMERIC CHECK (importe >= 0),
    foto_comprobante TEXT,
    metodo_pago TEXT,
    CONSTRAINT pagos_notas_venta_id_fkey FOREIGN KEY (notas_venta_id) REFERENCES public.notas_venta(id)
);

-- Gastos
CREATE TABLE public.gastos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    concepto TEXT,
    importe NUMERIC CHECK (importe >= 0),
    categoria TEXT
);

-- =====================================================
-- TABLAS DEL SISTEMA
-- =====================================================

-- Historial de chat
CREATE TABLE public.kz_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    message JSONB NOT NULL
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para mejorar rendimiento en consultas frecuentes
CREATE INDEX idx_productos_material ON public.productos(material);
CREATE INDEX idx_notas_venta_fecha ON public.notas_venta(fecha);
CREATE INDEX idx_notas_venta_cliente ON public.notas_venta(clientes_id);
CREATE INDEX idx_produccion_celofan_fecha ON public.produccion_celofan(fecha);
CREATE INDEX idx_produccion_polietileno_fecha ON public.produccion_polietileno(fecha);
CREATE INDEX idx_almacen_celofan_fecha ON public.almacen_celofan_movimientos(fecha);
CREATE INDEX idx_almacen_polietileno_fecha ON public.almacen_polietileno_movimientos(fecha);
CREATE INDEX idx_pagos_fecha ON public.pagos(fecha);
CREATE INDEX idx_gastos_fecha ON public.gastos(fecha);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de inventario actual de celofán
CREATE VIEW vista_inventario_celofan AS
SELECT 
    p.id as producto_id,
    p.nombre as producto,
    COALESCE(SUM(CASE WHEN acm.movimiento = 'entrada' THEN acm.millares ELSE -acm.millares END), 0) as stock_cares
FROM public.productos p
LEFT JOIN public.almacen_celofan_movimientos acm ON p.id = acm.producto_id
WHERE p.material = 'celofan'
GROUP BY p.id, p.nombre;

-- Vista de inventario actual de polietileno
CREATE VIEW vista_inventario_polietileno AS
SELECT 
    p.id as producto_id,
    p.nombre as producto,
    COALESCE(SUM(CASE WHEN apm.movimiento = 'entrada' THEN apm.kilos ELSE -apm.kilos END), 0) as stock_kilos
FROM public.productos p
LEFT JOIN public.almacen_polietileno_movimientos apm ON p.id = apm.producto_id
WHERE p.material = 'polietileno'
GROUP BY p.id, p.nombre;

-- Vista de ventas por cliente
CREATE VIEW vista_ventas_por_cliente AS
SELECT 
    c.id as cliente_id,
    c.empresa,
    c.nombre_contacto,
    COUNT(nv.id) as total_facturas,
    SUM(nv.total) as total_vendido
FROM public.clientes c
LEFT JOIN public.notas_venta nv ON c.id = nv.clientes_id
GROUP BY c.id, c.empresa, c.nombre_contacto;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para calcular el stock actual de un producto
CREATE OR REPLACE FUNCTION obtener_stock_producto(p_producto_id NUMERIC, p_material material_type)
RETURNS NUMERIC AS $$
DECLARE
    stock_actual NUMERIC := 0;
BEGIN
    IF p_material = 'celofan' THEN
        SELECT COALESCE(SUM(CASE WHEN movimiento = 'entrada' THEN millares ELSE -millares END), 0)
        INTO stock_actual
        FROM public.almacen_celofan_movimientos
        WHERE producto_id = p_producto_id;
    ELSIF p_material = 'polietileno' THEN
        SELECT COALESCE(SUM(CASE WHEN movimiento = 'entrada' THEN kilos ELSE -kilos END), 0)
        INTO stock_actual
        FROM public.almacen_polietileno_movimientos
        WHERE producto_id = p_producto_id;
    END IF;
    
    RETURN stock_actual;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Tabla de auditoría
CREATE TABLE public.auditoria (
    id SERIAL PRIMARY KEY,
    tabla TEXT NOT NULL,
    operacion TEXT NOT NULL,
    usuario TEXT,
    fecha_hora TIMESTAMP DEFAULT NOW(),
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

-- Función para trigger de auditoría
CREATE OR REPLACE FUNCTION trigger_auditoria() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.auditoria(tabla, operacion, usuario, datos_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.auditoria(tabla, operacion, usuario, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.auditoria(tabla, operacion, usuario, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría a tablas críticas
CREATE TRIGGER trigger_auditoria_productos AFTER INSERT OR UPDATE OR DELETE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

CREATE TRIGGER trigger_auditoria_notas_venta AFTER INSERT OR UPDATE OR DELETE ON public.notas_venta
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

CREATE TRIGGER trigger_auditoria_pagos AFTER INSERT OR UPDATE OR DELETE ON public.pagos
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();
