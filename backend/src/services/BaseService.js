class BaseService {
    constructor(repo) { this.repo = repo; }
    async getAll() { return await this.repo.findAll(); }
    async getById(id) { const r = await this.repo.findById(id); if(!r) throw {status:404, message:"Not found"}; return r; }
    async create(data) { return await this.repo.create(this._ser(data)); }
    async update(id, data) { await this.getById(id); return await this.repo.update(id, this._ser(data)); }
    async delete(id) { await this.getById(id); return await this.repo.delete(id); }
    _ser(data) { let p = {...data}; for(let k in p) if(typeof p[k]==='object') p[k]=JSON.stringify(p[k]); return p; }
} module.exports = BaseService;

