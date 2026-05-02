class TransactionManager {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Executes a callback within a MySQL transaction.
     * @param {Function} callback - Function receiving the transaction connection
     */
    async execute(callback) {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
module.exports = TransactionManager;
