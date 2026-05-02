class OrderService {
    constructor(db) { this.db = db; }
    async placeOrder(data) {
        const conn = await this.db.getConnection(); await conn.beginTransaction();
        try {
            const ordId = `ord_${Date.now()}`;
            await conn.query(`INSERT INTO orders SET ?`, { id: ordId, table_id: data.table_id, order_type: data.order_type, items: JSON.stringify(data.items), total: data.total });
            await conn.query(`INSERT INTO kots SET ?`, { id: `kot_${Date.now()}`, order_id: ordId, table_id: data.table_id, items: JSON.stringify(data.items), status: 'pending' });
            if (data.order_type === 'dinein') await conn.query(`UPDATE tables SET status='occupied', current_order_id=? WHERE id=?`, [ordId, data.table_id]);
            await conn.commit(); return { orderId: ordId };
        } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
    }
    async settleBill(data) {
        const conn = await this.db.getConnection(); await conn.beginTransaction();
        try {
            await conn.query(`INSERT INTO bills SET ?`, { id: `bill_${Date.now()}`, order_id: data.order_id, total: data.total });
            await conn.query(`UPDATE orders SET status='settled' WHERE id=?`, [data.order_id]);
            if (data.table_id) await conn.query(`UPDATE tables SET status='free', current_order_id=NULL WHERE id=?`, [data.table_id]);
            await conn.commit(); return { success: true };
        } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
    }
} module.exports = OrderService;

