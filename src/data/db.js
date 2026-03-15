import { supabase } from './supabaseClient';

export const db = {
  async init() {
    // We can use this to check connection or do initial setup if needed
    console.log('GRAVITU: Conectado a Supabase');
  },

  async login(username, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('active', true)
      .single();

    if (error || !data) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    const sessionUser = { id: data.id, username: data.username, role: data.role, name: data.name };
    localStorage.setItem('gravitu_session', JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout() {
    localStorage.removeItem('gravitu_session');
  },

  getCurrentUser() {
    const session = localStorage.getItem('gravitu_session');
    return session ? JSON.parse(session) : null;
  },

  async getData() {
    // Fetch all required data in parallel
    const [products, warehouses, movements, requisitions] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('warehouses').select('*').order('name'),
      supabase.from('movements').select('*, lines:movement_lines(*)').order('timestamp', { ascending: false }),
      supabase.from('requisitions').select('*, lines:requisition_lines(*)').order('timestamp', { ascending: false })
    ]);

    // Construct a stock map from movements (simplified for now, ideally we use a view or dedicated table)
    const stock = {};
    if (movements.data) {
      movements.data.forEach(m => {
        m.lines.forEach(l => {
          const key = `${l.product_id}_${m.warehouse_id}`;
          if (!stock[key]) stock[key] = { qty: 0, cost: 0 };
          
          if (m.type === 'entrada') {
            const totalValue = (stock[key].qty * stock[key].cost) + (l.qty * l.cost);
            stock[key].qty += l.qty;
            stock[key].cost = stock[key].qty > 0 ? totalValue / stock[key].qty : l.cost;
          } else {
            stock[key].qty -= l.qty;
          }
        });
      });
    }

    // Map snake_case from DB to camelCase for UI compatibility
    return {
      products: (products.data || []).map(p => ({
        ...p,
        min: p.min_stock
      })),
      warehouses: warehouses.data || [],
      movements: (movements.data || []).map(m => ({
        ...m,
        warehouseId: m.warehouse_id,
        userId: m.user_id,
        docRef: m.doc_ref,
        lines: (m.lines || []).map(l => ({
          ...l,
          productId: l.product_id
        }))
      })),
      requisitions: (requisitions.data || []).map(r => ({
        ...r,
        solicitanteId: r.solicitante_id,
        lines: (r.lines || []).map(l => ({
          ...l,
          productId: l.product_id
        }))
      })),
      stock: stock,
      users: [] 
    };
  },

  async getUsers() {
    const { data } = await supabase.from('users').select('*').order('name');
    return data || [];
  },

  // Business Logic: Add Movement
  async addMovement(movement, lines) {
    const { data: movData, error: movError } = await supabase
      .from('movements')
      .insert([{
        type: movement.type,
        warehouse_id: movement.warehouseId,
        doc_ref: movement.docRef,
        reason: movement.reason,
        user_id: movement.userId
      }])
      .select()
      .single();

    if (movError) throw movError;

    const lineItems = lines.map(l => ({
      movement_id: movData.id,
      product_id: l.productId,
      qty: l.qty,
      cost: l.cost
    }));

    const { error: linesError } = await supabase.from('movement_lines').insert(lineItems);
    if (linesError) throw linesError;

    return movData;
  },

  // Requisitions Logic
  async addRequisition(requisition, lines) {
    const { data: reqData, error: reqError } = await supabase
      .from('requisitions')
      .insert([{
        area: requisition.area,
        priority: requisition.priority,
        solicitante_id: requisition.solicitanteId
      }])
      .select()
      .single();

    if (reqError) throw reqError;

    const lineItems = lines.map(l => ({
      requisition_id: reqData.id,
      product_id: l.productId,
      qty: l.qty
    }));

    const { error: linesError } = await supabase.from('requisition_lines').insert(lineItems);
    if (linesError) throw linesError;

    return reqData;
  },

  async approveRequisition(reqId) {
    await supabase.from('requisitions').update({ status: 'aprobada' }).eq('id', reqId);
  },

  // Products Logic
  async addProduct(product) {
    const { data, error } = await supabase.from('products').insert([{
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      min_stock: Number(product.min)
    }]).select().single();
    
    if (error) throw error;
    return data;
  },

  // Users Logic
  async addUser(user) {
    const { data, error } = await supabase.from('users').insert([{
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role
    }]).select().single();

    if (error) throw error;
    return data;
  }
};
