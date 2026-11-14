const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clinicIntelligenceService = require('../services/clinicIntelligenceService');

/**
 * GET /api/v1/intelligence/forecast/:clinic_id
 * 7 to 14 day appointment volume forecast & staffing recommendations
 */
router.get('/forecast/:clinic_id', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const forecast = await clinicIntelligenceService.getDemandForecast(req.params.clinic_id, days);

    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/intelligence/heatmap/:clinic_id
 * Hourly congestion index and peak windows heatmap
 */
router.get('/heatmap/:clinic_id', authenticateToken, async (req, res) => {
  try {
    const heatmap = await clinicIntelligenceService.getPeakHoursHeatmap(req.params.clinic_id);

    return res.status(200).json({
      success: true,
      data: heatmap
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/intelligence/no-show/:clinic_id
 * No-show rate analytics and cancellation risk mitigation
 */
router.get('/no-show/:clinic_id', authenticateToken, async (req, res) => {
  try {
    const analytics = await clinicIntelligenceService.getNoShowAnalytics(req.params.clinic_id);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

