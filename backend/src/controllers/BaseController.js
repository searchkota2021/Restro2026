class BaseController {
    constructor(service) {
        this.service = service;
    }

    async getAll(req, res, next) {
        try {
            // Default to 100 records, page 1 if not provided
            const limit = req.query.limit || 100;
            const offset = req.query.offset || 0;
            const data = await this.service.getAll(limit, offset);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    async getById(req, res, next) {
        try {
            const data = await this.service.getById(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    async create(req, res, next) {
        try {
            // NOTE: In a strict enterprise app, req.body is validated here via Joi/Zod middleware first
            const data = await this.service.create(req.body);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }

    async update(req, res, next) {
        try {
            const data = await this.service.update(req.params.id, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    async delete(req, res, next) {
        try {
            await this.service.delete(req.params.id);
            res.status(200).json({ success: true, data: { message: "Deleted successfully" } });
        } catch (error) { next(error); }
    }
}
module.exports = BaseController;

