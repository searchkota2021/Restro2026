class DashboardController {
    constructor(dashboardService) {
        this.service = dashboardService;
    }
    
    async getSummary(req, res, next) {
        try {
            const data = await this.service.getSummary();
            res.status(200).json({ success: true, data });
        } catch (error) { 
            next(error); 
        }
    }
}
module.exports = DashboardController;
