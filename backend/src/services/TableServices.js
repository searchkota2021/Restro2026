const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');

class FloorService extends BaseService {
    constructor(floorRepo, tableRepo) { 
        super(floorRepo); 
        this.tableRepo = tableRepo; 
    }

    async delete(id) {
        const linkedTables = await this.tableRepo.findBy('floor_id', id);
        if (linkedTables.length > 0) throw new AppError("Cannot delete Floor. Please remove tables first.", 400);
        return super.delete(id);
    }
}

class TableService extends BaseService {
    constructor(tableRepo) { super(tableRepo); }

    async delete(id) {
        const table = await this.getById(id);
        if (table.status !== 'free' || table.current_order_id) {
            throw new AppError("Cannot delete Table. It currently has an active order.", 400);
        }
        return super.delete(id);
    }
}
module.exports = { FloorService, TableService };
