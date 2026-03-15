-- Tablas para el Sistema de Inventario GRAVITU

-- 1. Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  cost DECIMAL DEFAULT 0,
  price DECIMAL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Almacenes
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Movimientos (Cabecera)
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('entrada', 'salida')),
  warehouse_id UUID REFERENCES warehouses(id),
  doc_ref TEXT,
  reason TEXT,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Líneas de Movimiento (Detalle)
CREATE TABLE movement_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movement_id UUID REFERENCES movements(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty DECIMAL NOT NULL,
  cost DECIMAL NOT NULL
);

-- 5. Requerimientos
CREATE TABLE requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area TEXT NOT NULL,
  priority TEXT,
  status TEXT DEFAULT 'pendiente',
  solicitante_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Líneas de Requerimiento
CREATE TABLE requisition_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id UUID REFERENCES requisitions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty DECIMAL NOT NULL
);

-- 7. Usuarios (Personalizado)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Operador',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar Usuario Administrador por defecto
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '123', 'Usuario Administrador', 'Administrador');
