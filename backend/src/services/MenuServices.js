const BaseService = require('./BaseService');

/**
 * Service for Menu Groups
 * Extends BaseService to inherit standard CRUD, overriding delete for relational integrity.
 */
class GroupService extends BaseService {
    /**
     * @param {Object} groupRepo - Repository for the 'menu_groups' table
     * @param {Object} categoryRepo - Repository for the 'categories' table
     */
    constructor(groupRepo, categoryRepo) { 
        super(groupRepo); 
        this.categoryRepo = categoryRepo; 
    }
    
    /**
     * Overrides the base delete method.
     * Prevents deletion if the Group has Categories linked to it.
     * * @param {string} id - The ID of the group to delete
     * @returns {Promise<boolean>}
     * @throws Will throw a 400 error if categories are still linked
     */
    async delete(id) { 
        // 1. Check if any categories belong to this group
        const linkedCategories = await this.categoryRepo.findBy('group_id', id);
        
        // 2. Enforce relational safeguard
        if (linkedCategories.length > 0) {
            throw { 
                status: 400, 
                message: "Cannot delete Group. It currently contains Categories. Please delete or reassign them first." 
            };
        }
        
        // 3. If safe, proceed with standard deletion
        return super.delete(id); 
    }
}

/**
 * Service for Menu Categories
 */
class CategoryService extends BaseService {
    /**
     * @param {Object} categoryRepo - Repository for the 'categories' table
     * @param {Object} itemRepo - Repository for the 'items' table
     */
    constructor(categoryRepo, itemRepo) {
        super(categoryRepo);
        this.itemRepo = itemRepo;
    }

    /**
     * Overrides the base delete method to protect linked items.
     */
    async delete(id) {
        const linkedItems = await this.itemRepo.findBy('category_id', id);
        if (linkedItems.length > 0) {
            throw { 
                status: 400, 
                message: "Cannot delete Category. It currently contains Items. Please delete or reassign them first." 
            };
        }
        return super.delete(id);
    }
}

module.exports = { GroupService, CategoryService };

