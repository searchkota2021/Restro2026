const AppError = require('../utils/AppError');

class BaseService {
    constructor(repository) {
        this.repository = repository;
    }

    async getAll(limit = 100, offset = 0) {
        return await this.repository.findAll(limit, offset);
    }
    
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) throw new AppError("Resource not found", 404);
        return record;
    }

    async create(data) {
        return await this.repository.create(this._serialize(data));
    }
    
    async update(id, data) {
        await this.getById(id); 
        return await this.repository.update(id, this._serialize(data));
    }

    async delete(id) {
        await this.getById(id);
        return await this.repository.delete(id);
    }

    _serialize(data) {
        const parsed = { ...data };
        for (const key in parsed) {
            if (typeof parsed[key] === 'object' && parsed[key] !== null) {
                parsed[key] = JSON.stringify(parsed[key]);
            }
        }
        return parsed;
    }
}
module.exports = BaseService;
