class BaseRepository {
    constructor(dbPool, tableName) {
        this.db = dbPool;
        this.tableName = tableName;
    }

    // Now supports Pagination to prevent memory crashes
    async findAll(limit = 100, offset = 0) {
        const [rows] = await this.db.query(`SELECT * FROM ?? LIMIT ? OFFSET ?`, [this.tableName, Number(limit), Number(offset)]);
        return rows;
    }

    async findBy(field, value) {
        const [rows] = await this.db.query(`SELECT * FROM ?? WHERE ?? = ?`, [this.tableName, field, value]);
        return rows;
    }

    // Accepts optional `tx` (transaction connection) parameter
    async findById(id, tx = this.db) {
        const [rows] = await tx.query(`SELECT * FROM ?? WHERE id = ?`, [this.tableName, id]);
        return rows[0] || null;
    }

    async create(data, tx = this.db) {
        await tx.query(`INSERT INTO ?? SET ?`, [this.tableName, data]);
        return this.findById(data.id, tx);
    }

    async update(id, data, tx = this.db) {
        await tx.query(`UPDATE ?? SET ? WHERE id = ?`, [this.tableName, data, id]);
        return this.findById(id, tx);
    }

    async delete(id, tx = this.db) {
        const [result] = await tx.query(`DELETE FROM ?? WHERE id = ?`, [this.tableName, id]);
        return result.affectedRows > 0;
    }
}
module.exports = BaseRepository;
