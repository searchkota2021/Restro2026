const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');

class GroupService extends BaseService {
    constructor(groupRepo, categoryRepo) { 
        super(groupRepo); 
        this.categoryRepo = categoryRepo; 
    }
    
    async delete(id) {
        const linkedCats = await this.categoryRepo.findBy('group_id', id);
        if (linkedCats.length > 0) throw new AppError("Cannot delete Group. It contains Categories.", 400);
        return super.delete(id);
    }
}

class CategoryService extends BaseService {
    constructor(categoryRepo, itemRepo) {
        super(categoryRepo);
        this.itemRepo = itemRepo;
    }

    async delete(id) {
        const linkedItems = await this.itemRepo.findBy('category_id', id);
        if (linkedItems.length > 0) throw new AppError("Cannot delete Category. It contains Items.", 400);
        return super.delete(id);
    }
}
module.exports = { GroupService, CategoryService };
