// Vercel API function for checking Claude API status
export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Check if API key is configured in environment
        const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
        
        res.status(200).json({
            apiEnabled: hasApiKey,
            status: hasApiKey ? 'Claude AI Ready' : 'API Key Not Configured'
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ 
            error: 'Failed to check API status',
            apiEnabled: false,
            status: 'Error checking status'
        });
    }
}