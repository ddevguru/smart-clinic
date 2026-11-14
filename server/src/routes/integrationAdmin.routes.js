const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/auth');
const integrationAdminService = require('../services/integrationAdminService');

/**
 * GET /api/v1/admin/integrations
 * Super Admin lists all platform integrations with status and masked secrets
 */
router.get('/', authenticateToken, requireRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const integrations = await integrationAdminService.getAllIntegrations();
    return res.status(200).json({
      success: true,
      data: { integrations }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * PATCH /api/v1/admin/integrations/:slug
 * Super Admin toggles integration enable/disable
 */
router.patch('/:slug', authenticateToken, requireRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { is_enabled } = req.body;
    if (is_enabled === undefined) {
      return res.status(400).json({ success: false, error: { message: 'is_enabled boolean is required' } });
    }

    const updated = await integrationAdminService.toggleIntegration(req.params.slug, is_enabled);

    return res.status(200).json({
      success: true,
      message: `Integration '${req.params.slug}' status updated to ${updated.status}`,
      data: { integration: updated }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/admin/integrations/:slug/sync
 * Super Admin manually triggers integration sync and latency test
 */
router.post('/:slug/sync', authenticateToken, requireRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await integrationAdminService.triggerSync(req.params.slug);

    return res.status(200).json({
      success: true,
      message: `Sync executed for ${req.params.slug}`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

