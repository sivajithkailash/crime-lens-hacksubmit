import { Router } from 'express';
import eventsService from '../services/eventsService.js';

const router = Router();

/**
 * GET /api/events/chennai
 * Fetch major events in Chennai for the upcoming week
 */
router.get('/chennai', async (req, res) => {
  try {
    const events = await eventsService.fetchChennaiEvents();
    
    // Add metadata for the response
    const response = {
      ...events,
      metadata: {
        location: 'Chennai, India',
        radius_km: 50,
        time_range: 'Next 7 days',
        filters: {
          min_rank: 60,
          categories: [
            'concerts',
            'conferences', 
            'expos',
            'festivals',
            'performing-arts',
            'sports',
            'community',
            'academic'
          ]
        },
        fetched_at: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/events/chennai:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API token not configured')) {
        return res.status(503).json({
          error: 'Events service not configured',
          message: 'PredictHQ API token is not configured. Please contact administrator.',
          code: 'SERVICE_NOT_CONFIGURED'
        });
      }
      
      if (error.message.includes('PredictHQ API error')) {
        return res.status(502).json({
          error: 'External API error',
          message: 'Unable to fetch events from PredictHQ service. Please try again later.',
          code: 'EXTERNAL_API_ERROR'
        });
      }
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching events.',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/events/test
 * Test endpoint to check if the events service is configured correctly
 */
router.get('/test', async (req, res) => {
  try {
    const hasToken = !!process.env.PREDICTHQ_API_TOKEN;
    
    if (!hasToken) {
      return res.json({
        status: 'not_configured',
        message: 'PredictHQ API token not found in environment variables',
        configured: false
      });
    }
    
    // Try to make a simple API call to test connectivity
    const testResponse = await fetch('https://api.predicthq.com/v1/events/?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.PREDICTHQ_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (testResponse.ok) {
      res.json({
        status: 'configured',
        message: 'PredictHQ API is properly configured and accessible',
        configured: true
      });
    } else {
      res.json({
        status: 'invalid_token',
        message: 'PredictHQ API token appears to be invalid',
        configured: false,
        api_status: testResponse.status
      });
    }
    
  } catch (error) {
    console.error('Error testing events service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Unable to test events service configuration',
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
