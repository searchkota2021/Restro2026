const AppError = require('../utils/AppError');

class OrderService {
    constructor(orderRepo, kotRepo, tableRepo, inventoryRepo, txManager) {
        this.orderRepo = orderRepo;
        this.kotRepo = kotRepo;
        this.tableRepo = tableRepo;
        this.inventoryRepo = inventoryRepo;
        this.txManager = txManager;
    }

    async placeOrder(data) {
        return await this.txManager.execute(async (tx) => {
            const orderId = `ord_${Date.now()}`;
            
            // 1. Create Order
            await this.orderRepo.create({
                id: orderId, table_id: data.table_id, order_type: data.order_type, 
                items: JSON.stringify(data.items), total: data.total
            }, tx);

            // 2. Fire KOT
            const kotId = `kot_${Date.now()}`;
            await this.kotRepo.create({
                id: kotId, order_id: orderId, table_id: data.table_id, 
                items: JSON.stringify(data.items), status: 'pending'
            }, tx);

            // 3. Update Table Status
            if (data.order_type === 'dinein' && data.table_id) {
                await this.tableRepo.update(data.table_id, {
                    status: 'occupied', current_order_id: orderId
                }, tx);
            }

            return { orderId, kotId };
        });
    }

    async settleBill(data) {
        return await this.txManager.execute(async (tx) => {
            // Settle Order
            await this.orderRepo.update(data.order_id, { status: 'settled' }, tx);

            // Deduct Inventory (Simplified)
            for (let item of data.items) {
                const invRecords = await this.inventoryRepo.findBy('item_name', item.name);
                if (invRecords.length > 0) {
                    const inv = invRecords[0];
                    await this.inventoryRepo.update(inv.id, { available_qty: inv.available_qty - item.qty }, tx);
                }
            }

            // Free Table
            if (data.table_id) {
                await this.tableRepo.update(data.table_id, {
                    status: 'free', current_order_id: null
                }, tx);
            }

            return { success: true };
        });
    }
}
module.exports = OrderService;
