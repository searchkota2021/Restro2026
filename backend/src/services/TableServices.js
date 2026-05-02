const BaseService = require('./BaseService');

/**
 * Service for Restaurant Floors
 * Extends BaseService to protect the physical floor plan hierarchy.
 */
class FloorService extends BaseService {
    /**
     * @param {Object} floorRepo - Repository for the 'floors' table
     * @param {Object} tableRepo - Repository for the 'tables' table
     */
    constructor(floorRepo, tableRepo) { 
        super(floorRepo); 
        this.tableRepo = tableRepo; 
    }

    /**
     * Overrides the base delete method.
     * Prevents deletion if the Floor has physical Tables assigned to it.
     * * @param {string} id - The ID of the floor to delete
     * @returns {Promise<boolean>}
     * @throws Will throw a 400 error if tables are still linked
     */
    async delete(id) { 
        // 1. Check if any tables are assigned to this floor
        const linkedTables = await this.tableRepo.findBy('floor_id', id);
        
        // 2. Enforce relational safeguard
        if (linkedTables.length > 0) {
            throw { 
                status: 400, 
                message: "Cannot delete Floor. There are still tables assigned to it. Please remove the tables first." 
            };
        }
        
        // 3. If safe, proceed with standard deletion
        return super.delete(id); 
    }
}

/**
 * Service for Restaurant Tables
 */
class TableService extends BaseService {
    /**
     * @param {Object} tableRepo - Repository for the 'tables' table
     */
    constructor(tableRepo) { 
        super(tableRepo); 
    }

    /**
     * Overrides the base delete method to protect active restaurant operations.
     */
    async delete(id) { 
        // Fetch the table details using the inherited getById method
        const table = await this.getById(id);
        
        // Prevent deleting a table that is currently occupied or has an active order
        if (table.status !== 'free' || table.current_order_id !== null) {
            throw { 
                status: 400, 
                message: "Cannot delete Table. It currently has an active order or is occupied/reserved." 
            };
        }
        
        return super.delete(id); 
    }
}

module.exports = { FloorService, TableService };

