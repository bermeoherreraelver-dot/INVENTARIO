import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ClipboardList,
  Settings,
  Bell,
  User,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Users,
  Building2,
  FileText,
  Clock,
  ChevronRight,
  Filter,
  Download,
  LogOut
} from 'lucide-react';
import { db } from './data/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Dashboard Component ---
const Dashboard = ({ data }) => {
  const stockValuation = data.products.map(p => {
    const qty = Object.keys(data.stock)
      .filter(k => k.startsWith(`${p.id}_`))
      .reduce((acc, k) => acc + data.stock[k].qty, 0);
    return { name: p.sku, value: qty };
  });

  const totalItems = data.products.reduce((acc, p) => {
    const qty = Object.keys(data.stock)
      .filter(k => k.startsWith(`${p.id}_`))
      .reduce((a, k) => a + data.stock[k].qty, 0);
    return acc + qty;
  }, 0);

  const stats = [
    { label: 'Stock Total', value: totalItems.toLocaleString(), icon: Package, color: 'var(--primary)' },
    { label: 'Movimientos', value: data.movements.length.toString(), icon: Clock, color: 'var(--success)' },
    {
      label: 'Alertas', value: data.products.filter(p => {
        const qty = Object.keys(data.stock).filter(k => k.startsWith(`${p.id}_`)).reduce((a, k) => a + data.stock[k].qty, 0);
        return qty < p.min;
      }).length.toString(), icon: Bell, color: 'var(--danger)'
    },
    { label: 'Almacenes', value: data.warehouses.length.toString(), icon: Building2, color: 'var(--warning)' },
  ];

  return (
    <div className="animate-fade-in p-6">
      <header className="mb-8">
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Resumen General</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bienvenido al sistema de inventario corporativo.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div style={{ backgroundColor: `${stat.color}15`, padding: '0.75rem', borderRadius: '0.75rem', color: stat.color }}><stat.icon size={24} /></div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-8" style={{ background: 'linear-gradient(to right, var(--bg-card), var(--bg-sidebar))' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Acciones Rápidas</h3>
        <div className="flex gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'movements' }))}
            style={{
              background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: 'var(--radius-lg)',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'center'
            }}>
            <ArrowDownLeft size={20} /> Registrar Movimiento
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'requisitions' }))}
            style={{
              background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '1rem 2rem',
              borderRadius: 'var(--radius-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'center'
            }}>
            <ClipboardList size={20} /> Crear Requerimiento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card p-6" style={{ height: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Stock por Producto</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={stockValuation}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Alertas de Stock</h3>
          <div className="flex flex-col gap-3">
            {data.products.filter(p => {
              const qty = Object.keys(data.stock).filter(k => k.startsWith(`${p.id}_`)).reduce((a, k) => a + data.stock[k].qty, 0);
              return qty < p.min;
            }).map(p => {
              const qty = Object.keys(data.stock).filter(k => k.startsWith(`${p.id}_`)).reduce((a, k) => a + data.stock[k].qty, 0);
              return (
                <div key={p.id} className="p-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--danger)05' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--danger)' }}>{p.sku}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actual: {qty} | Mín: {p.min}</p>
                </div>
              )
            })}
            {data.products.length > 0 && data.products.filter(p => {
              const qty = Object.keys(data.stock).filter(k => k.startsWith(`${p.id}_`)).reduce((a, k) => a + data.stock[k].qty, 0);
              return qty < p.min;
            }).length === 0 && <p className="text-muted">No hay alertas activas.</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 style={{ marginBottom: '1.5rem' }}>Últimos Movimientos</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <th style={{ padding: '0.75rem' }}>TIPO</th>
              <th style={{ padding: '0.75rem' }}>REF</th>
              <th style={{ padding: '0.75rem' }}>USUARIO</th>
              <th style={{ padding: '0.75rem' }}>FECHA</th>
            </tr>
          </thead>
          <tbody>
            {data.movements.slice(-5).reverse().map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem',
                    background: m.type === 'entrada' ? 'var(--success)20' : 'var(--danger)20',
                    color: m.type === 'entrada' ? 'var(--success)' : 'var(--danger)'
                  }}>{m.type.toUpperCase()}</span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{m.docRef || '-'}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{m.userId}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(m.timestamp), 'dd MMM, HH:mm')}</td>
              </tr>
            ))}
            {data.movements.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sin actividad reciente.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = ({ onLogin, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await db.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url(/hosp-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="card p-8 animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', height: '60px', borderRadius: '15px', 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '2rem', fontWeight: 800,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <img 
              src={settings?.logo_base64 || "/logo.png"} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
              onError={(e) => e.target.style.opacity = 0} 
            />
            <span style={{ pointerEvents: 'none' }}>I</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bienvenido</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ingrese sus credenciales de INVENTARIO</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div style={{ background: 'var(--danger)20', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Usuario del Sistema</label>
            <input 
              type="text" 
              style={{ width: '100%', height: '45px' }} 
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
            <input 
              type="password" 
              style={{ width: '100%', height: '45px' }} 
              placeholder="123"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            style={{ 
              height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', 
              color: 'white', fontWeight: 700, fontSize: '1rem', marginTop: '1rem' 
            }}
          >
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿Olvidó su contraseña? <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Solicitar ayuda</span>
        </div>
      </div>
    </div>
  );
};

// --- Products Page ---
const Products = ({ products, data, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Oficina',
    unit: 'Und',
    min: 0
  });

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await db.addProduct({
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      min: Number(formData.min)
    });
    setShowModal(false);
    onUpdate();
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Mantenimiento del maestro de artículos valorizados.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Crear Producto
        </button>
      </div>
      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
          <div className="flex gap-4 items-center" style={{ maxWidth: '400px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por SKU o nombre..."
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', color: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Categoría</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>U.M.</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Stock Total</th>
              {/* <th style={{ padding: '1rem', textAlign: 'right' }}>Costo Prom.</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.sku}</td>
                <td style={{ padding: '1rem' }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--border)', borderRadius: '4px' }}>{p.category}</span>
                </td>
                <td style={{ padding: '1rem' }}>{p.unit}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                  {Object.keys(data.stock)
                    .filter(k => k.startsWith(`${p.id}_`))
                    .reduce((acc, k) => acc + data.stock[k].qty, 0)
                  }
                </td>
                {/* <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>S/ {p.cost.toFixed(2)}</td> */}
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {searchTerm ? 'No se encontraron productos para esta búsqueda.' : 'No hay productos registrados.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', zIndex: 9999,
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="card p-8 animate-fade-in" style={{
            width: '100%',
            maxWidth: '550px',
            margin: 'auto',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Nuevo Producto</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>SKU (Código)</label>
                  <input type="text" style={{ width: '100%', height: '45px' }} placeholder="PROD-001" onChange={e => setFormData({ ...formData, sku: e.target.value })} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Categoría</label>
                  <input type="text" style={{ width: '100%', height: '45px' }} placeholder="Ej: Herramientas" onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Nombre o Descripción</label>
                <input type="text" style={{ width: '100%', height: '45px' }} placeholder="Ej: Taladro Percutor 20V" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>U.M. (Unidad de Medida)</label>
                  <input type="text" style={{ width: '100%', height: '45px' }} placeholder="Und, Kg, Metro" onChange={e => setFormData({ ...formData, unit: e.target.value })} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Stock Mínimo (Alerta)</label>
                  <input type="number" style={{ width: '100%', height: '45px' }} placeholder="0" onChange={e => setFormData({ ...formData, min: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700 }}>Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Movements Page ---
const Movements = ({ movements, products, warehouses, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'entrada',
    warehouseId: warehouses[0]?.id || '',
    productId: products[0]?.id || '',
    qty: 0,
    cost: 0,
    docRef: '',
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.addMovement({
        type: formData.type,
        warehouseId: formData.warehouseId,
        docRef: formData.docRef,
        reason: formData.reason,
        userId: 'admin'
      }, [{
        productId: formData.productId,
        qty: Number(formData.qty),
        cost: Number(formData.cost)
      }]);
      setShowModal(false);
      onUpdate();
      alert('Movimiento registrado con éxito');
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredMovements = movements.filter(m => {
    const docMatch = (m.docRef || '').toLowerCase().includes(searchTerm.toLowerCase());
    const userMatch = (m.userId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const productMatch = m.lines.some(l => {
      const p = products.find(prod => prod.id === l.productId);
      return p?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return docMatch || userMatch || productMatch;
  });

  const handleExport = () => {
    if (filteredMovements.length === 0) return alert('No hay datos para exportar');

    const dataToExport = filteredMovements.flatMap(m =>
      m.lines.map(l => {
        const p = products.find(prod => prod.id === l.productId);
        const w = warehouses.find(wh => wh.id === m.warehouseId);
        return {
          'Fecha': format(new Date(m.timestamp), 'dd/MM/yyyy HH:mm'),
          'Tipo': m.type.toUpperCase(),
          'Producto': p?.name || '',
          'SKU': p?.sku || '',
          'Cantidad': l.qty,
          'UM': p?.unit || '',
          'Referencia': m.docRef || '',
          'Usuario': m.userId,
          'Almacen': w?.name || ''
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    // Auto-ajustar anchos de columna (opcional pero profesional)
    const maxWidths = [
      { wch: 18 }, { wch: 10 }, { wch: 35 }, { wch: 15 },
      { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 15 }
    ];
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Reporte_Movimientos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Movimientos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro histórico de entradas y salidas.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
            <Download size={18} /> Exportar Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
            <Plus size={18} /> Nuevo Movimiento
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
          <div className="flex gap-4 items-center" style={{ maxWidth: '400px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por referencia o usuario..."
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', color: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>FECHA</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>PRODUCTO</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>TIPO</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>REF</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>USUARIO</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>DETALLE</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchTerm ? 'No se encontraron movimientos para esta búsqueda.' : 'No hay movimientos registrados hoy.'}
                </td>
              </tr>
            ) : (
              filteredMovements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{format(new Date(m.timestamp), 'dd/MM/yy HH:mm')}</td>
                  <td style={{ padding: '1rem' }}>
                    {m.lines.map(l => {
                      const p = products.find(prod => prod.id === l.productId);
                      return (
                        <div key={l.productId} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {p?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({l.qty} {p?.unit})</span>
                        </div>
                      );
                    })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      background: m.type === 'entrada' ? 'var(--success)20' : 'var(--danger)20',
                      color: m.type === 'entrada' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {m.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{m.docRef || '-'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{m.userId}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Ver líneas</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', zIndex: 9999,
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="card p-8 animate-fade-in" style={{
            width: '100%',
            maxWidth: '550px',
            margin: 'auto',
            background: 'var(--bg-card)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255,255,255,0.15)',
            position: 'relative'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Nuevo Movimiento</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Tipo de Operación</label>
                  <select
                    style={{ width: '100%', height: '45px' }}
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="entrada">Entrada (Ingreso)</option>
                    <option value="salida">Salida (Egreso)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Almacén</label>
                  <select
                    style={{ width: '100%', height: '45px' }}
                    value={formData.warehouseId}
                    onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Producto a Movilizar</label>
                <select
                  style={{ width: '100%', height: '45px' }}
                  value={formData.productId}
                  onChange={e => setFormData({ ...formData, productId: e.target.value })}
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                </select>
              </div>

              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Cantidad</label>
                  <input
                    step="0.01"
                    style={{ width: '100%', height: '45px' }}
                    placeholder="0.00"
                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Costo Unit. (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: '100%', height: '45px', opacity: 0.5 }}
                    placeholder="0.00"
                    disabled={true}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Referencia (Documento)</label>
                <input
                  type="text"
                  style={{ width: '100%', height: '45px' }}
                  placeholder="Ej: Factura F001-1234"
                  onChange={e => setFormData({ ...formData, docRef: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem' }}
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Reports Page (Kardex) ---
const Reports = ({ movements, products }) => {
  const [selectedProd, setSelectedProd] = useState(products[0]?.id || '');

  const kardex = movements
    .filter(m => m.lines.some(l => l.productId === selectedProd))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let runningStock = 0;

  return (
    <div className="animate-fade-in p-6">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Reportes de Inventario</h1>
      <div className="card p-6 mb-6">
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Seleccionar Producto para Kardex</label>
        <select
          className="p-2"
          style={{ width: '100%', maxWidth: '300px' }}
          value={selectedProd}
          onChange={e => setSelectedProd(e.target.value)}
        >
          {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-sidebar)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>FECHA</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>MOTIVO</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>ENTRADA</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>SALIDA</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>SALDO</th>
            </tr>
          </thead>
          <tbody>
            {kardex.map(m => {
              const line = m.lines.find(l => l.productId === selectedProd);
              if (m.type === 'entrada') runningStock += line.qty;
              else runningStock -= line.qty;

              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{format(new Date(m.timestamp), 'dd/MM/yy')}</td>
                  <td style={{ padding: '1rem' }}>{m.docRef || 'Ajuste'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)' }}>{m.type === 'entrada' ? line.qty : '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--danger)' }}>{m.type === 'salida' ? line.qty : '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{runningStock}</td>
                </tr>
              );
            })}
            {kardex.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos para este producto.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Requisitions Page ---
const Requisitions = ({ requisitions, products, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    area: '',
    productId: products[0]?.id || '',
    qty: 0,
    priority: 'media'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await db.addRequisition({
      area: formData.area,
      priority: formData.priority,
      solicitanteId: 'admin'
    }, [{ productId: formData.productId, qty: Number(formData.qty) }]);
    setShowModal(false);
    onUpdate();
  };

  const handleApprove = async (id) => {
    await db.approveRequisition(id);
    onUpdate();
  };

  const filteredRequisitions = requisitions.filter(r =>
    (r.area || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Requerimientos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Solicitudes de reposición por área u obra.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Crear Solicitud
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
          <div className="flex gap-4 items-center" style={{ maxWidth: '400px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por área u obra..."
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', color: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>FECHA</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>ÁREA/OBRA</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>ESTADO</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequisitions.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{format(new Date(r.timestamp), 'dd/MM/yy')}</td>
                <td style={{ padding: '1rem' }}>{r.area}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem',
                    background: r.status === 'pendiente' ? 'var(--warning)20' : 'var(--success)20',
                    color: r.status === 'pendiente' ? 'var(--warning)' : 'var(--success)'
                  }}>{r.status.toUpperCase()}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {r.status === 'pendiente' && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Aprobar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequisitions.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {searchTerm ? 'No se encontraron requerimientos para esta búsqueda.' : 'No hay requerimientos pendientes.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', zIndex: 9999,
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="card p-8 animate-fade-in" style={{
            width: '100%',
            maxWidth: '480px',
            margin: 'auto',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Nuevo Requerimiento</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Área u Obra Destino</label>
                <input type="text" style={{ width: '100%', height: '45px' }} placeholder="Ej: Obra Calle San Isidro" onChange={e => setFormData({ ...formData, area: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Producto Solicitado</label>
                <select style={{ width: '100%', height: '45px' }} onChange={e => setFormData({ ...formData, productId: e.target.value })}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Cantidad</label>
                  <input type="number" style={{ width: '100%', height: '45px' }} placeholder="0" onChange={e => setFormData({ ...formData, qty: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.5rem' }}>Prioridad</label>
                  <select style={{ width: '100%', height: '45px' }} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="media">Rutinaria (Media)</option>
                    <option value="alta">Urgente (Alta)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700 }}>Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Masters Page (Almacenes, Proveedores) ---
// --- Masters Page (Almacenes, Proveedores, Usuarios) ---
const Masters = ({ users = [], warehouses = [], onUpdate, currentUser, settings }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Operador'
  });
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address: ''
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await db.addUser(userForm);
      setShowUserModal(false);
      onUpdate();
      alert('Usuario creado con éxito');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      await db.addWarehouse(warehouseForm);
      setShowWarehouseModal(false);
      setWarehouseForm({ name: '', code: '', address: '' });
      onUpdate();
      alert('Almacén/Obra agregado con éxito');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in p-6">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Administración del Sistema</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Usuarios - Solo para Administradores */}
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="flex items-center gap-2"><Users size={20} /> Gestión de Usuarios</h3>
            {currentUser?.role === 'Administrador' && (
              <button 
                onClick={() => setShowUserModal(true)}
                style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Nuevo Usuario</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div key={u.id} className="p-3 rounded-lg flex justify-between items-center" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username} • {u.role}</div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--success)20', color: 'var(--success)', borderRadius: '10px' }}>Activo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="flex items-center gap-2"><Building2 size={20} /> Almacenes / Obras / Lugares</h3>
            <button 
              onClick={() => setShowWarehouseModal(true)}
              style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Agregar</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {warehouses.map(wh => (
              <div key={wh.id} className="p-3 bg-main rounded-lg flex justify-between items-center" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{wh.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wh.code} • {wh.address || 'Sin dirección'}</div>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--success)20', color: 'var(--success)', borderRadius: '10px' }}>Activo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="flex items-center gap-2"><Package size={20} /> Proveedores</h3>
            <button style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Agregar</button>
          </div>
          <div className="p-8 text-center text-muted" style={{ fontSize: '0.875rem' }}>Módulo de proveedores en desarrollo.</div>
        </div>

        {/* Personalización - Carga de Logo */}
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="flex items-center gap-2"><Settings size={20} /> Personalización</h3>
          </div>
          <div style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Sube el logo de tu empresa</p>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {settings?.logo_base64 ? <img src={settings.logo_base64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={30} color="var(--text-muted)" />}
            </div>
            <input 
              type="file" 
              id="logo-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    await db.updateSetting('logo_base64', reader.result);
                    onUpdate();
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label 
              htmlFor="logo-upload" 
              style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Cambiar Logo
            </label>
          </div>
        </div>
      </div>

      {showUserModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', zIndex: 9999,
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="card p-8 animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Crear Nuevo Usuario</h2>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Nombre Completo</label>
                <input type="text" style={{ width: '100%' }} placeholder="Ej: Juan Pérez" onChange={e => setUserForm({...userForm, name: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Usuario</label>
                  <input type="text" style={{ width: '100%' }} placeholder="jperez" onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                  <input type="password" style={{ width: '100%' }} placeholder="****" onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Rol del Sistema</label>
                <select style={{ width: '100%' }} value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="Administrador">Administrador (Total)</option>
                  <option value="Supervisor">Supervisor (Ver y Reportes)</option>
                  <option value="Operador">Operador (Entradas/Salidas)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>Crear Cuenta</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Main Layout ---
function App() {
  const [user, setUser] = useState(db.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState({ products: [], movements: [], warehouses: [], stock: {} });
  const [settings, setSettings] = useState({ logo_base64: null });

  const handleLogout = () => {
    db.logout();
    setUser(null);
  };

  const handleLogin = (newUser) => {
    setUser(newUser);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'movements', label: 'Movimientos', icon: Clock },
    { id: 'transfers', label: 'Transferencias', icon: ArrowLeftRight },
    { id: 'requisitions', label: 'Requerimientos', icon: ClipboardList },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'masters', label: 'Administración', icon: Settings },
  ];

  useEffect(() => {
    const init = async () => {
      await db.init();
      const [dbData, dbSettings] = await Promise.all([
        db.getData(),
        db.getSettings()
      ]);
      setData(dbData);
      setSettings(prev => ({ ...prev, ...dbSettings }));
    };
    init();

    const handleTabChange = (e) => setActiveTab(e.detail);
    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  if (!user) {
    return <Login onLogin={handleLogin} settings={settings} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '260px' : '80px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 20
      }}>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <img 
              src={settings?.logo_base64 || "/logo.png"} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
              onError={(e) => e.target.style.opacity = 0} 
            />
            <span style={{ pointerEvents: 'none' }}>I</span>
          </div>
          {isSidebarOpen && <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>INVENTARIO</span>}
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: activeTab === item.id ? 'var(--text-main)' : 'var(--text-muted)',
                background: activeTab === item.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                marginBottom: '0.25rem'
              }}
            >
              <item.icon size={20} color={activeTab === item.id ? 'var(--primary)' : 'currentColor'} />
              {isSidebarOpen && <span style={{ fontWeight: 500 }}>{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && (
                <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', position: 'relative' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: '#334155', flexShrink: 0, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'white'
            }}>
              {user.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</p>
              </div>
            )}
            {isSidebarOpen && (
              <button 
                onClick={handleLogout}
                style={{ color: 'var(--danger)', opacity: 0.7, padding: '0.25rem' }}
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '76px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div className="flex gap-4 items-center">
            <div style={{ background: 'var(--bg-card)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {format(new Date(), "eeee, d 'de' MMMM", { locale: es })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', alignSelf: 'center' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronizado</span>
            </div>
            <button className="p-2" style={{ color: 'var(--text-muted)' }}><Bell size={20} /></button>
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }} />
            <button style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              GMT-5
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          {activeTab === 'products' && (
            <Products
              products={data.products}
              data={data}
              onUpdate={async () => {
                const dbData = await db.getData();
                setData(dbData);
              }}
            />
          )}
          {activeTab === 'movements' && (
            <Movements
              movements={data.movements}
              products={data.products}
              warehouses={data.warehouses}
              onUpdate={async () => {
                const dbData = await db.getData();
                setData(dbData);
              }}
            />
          )}
          {activeTab === 'requisitions' && (
            <Requisitions
              requisitions={data.requisitions}
              products={data.products}
              onUpdate={async () => {
                const dbData = await db.getData();
                setData(dbData);
              }}
            />
          )}
          {activeTab === 'masters' && (
            <Masters 
              users={data.users} 
              warehouses={data.warehouses}
              currentUser={user}
              settings={settings}
              onUpdate={async () => {
                const [dbData, dbSettings] = await Promise.all([
                  db.getData(),
                  db.getSettings()
                ]);
                setData(dbData);
                setSettings(prev => ({ ...prev, ...dbSettings }));
              }} 
            />
          )}
          {activeTab === 'reports' && <Reports movements={data.movements} products={data.products} />}
          {/* Add other tab components here */}
          {(['transfers'].includes(activeTab)) && (
            <div className="p-12 text-center animate-fade-in" style={{ marginTop: '10vh' }}>
              <Building2 size={64} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Módulo "{activeTab}"</h2>
              <p style={{ color: 'var(--text-muted)' }}>Esta funcionalidad está siendo implementada para la versión corporativa.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
