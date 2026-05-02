class DashboardService {
    constructor(dbPool) {
        this.db = dbPool;
    }

    async getSummary() {
        const [[{ revenue, orders }]] = await this.db.query(`
            SELECT IFNULL(SUM(total), 0) as revenue, COUNT(id) as orders 
            FROM bills WHERE DATE(settled_at) = CURDATE()
        `);

        const [[{ occupied, total_tables }]] = await this.db.query(`
            SELECT 
                SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
                COUNT(id) as total_tables 
            FROM tables
        `);

        const [[{ pending_kots }]] = await this.db.query(`
            SELECT COUNT(id) as pending_kots FROM kots WHERE status = 'pending'
        `);

        return {
            revenue: parseFloat(revenue),
            orders_served: parseInt(orders),
            tables_occupied: parseInt(occupied) || 0,
            tables_total: parseInt(total_tables) || 0,
            pending_kots: parseInt(pending_kots) || 0
        };
    }
}
module.exports = DashboardService;

