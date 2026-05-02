class BaseRepository {
    constructor(db, table) { this.db = db; this.table = table; }
    async findAll() { const [rows] = await this.db.query(`SELECT * FROM ??`, [this.table]); return rows; }
    async findBy(field, val) { const [rows] = await this.db.query(`SELECT * FROM ?? WHERE ??=?`, [this.table, field, val]); return rows; }
    async findById(id) { const [rows] = await this.db.query(`SELECT * FROM ?? WHERE id=?`, [this.table, id]); return rows[0]; }
    async create(data) { await this.db.query(`INSERT INTO ?? SET ?`, [this.table, data]); return this.findById(data.id); }
    async update(id, data) { await this.db.query(`UPDATE ?? SET ? WHERE id=?`, [this.table, data, id]); return this.findById(id); }
    async delete(id) { const [r] = await this.db.query(`DELETE FROM ?? WHERE id=?`, [this.table, id]); return r.affectedRows > 0; }
} module.exports = BaseRepository;

