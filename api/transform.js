// Vercel API function for Claude AI transformations
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { customText } = req.body;
        
        if (!customText || !customText.trim()) {
            return res.status(400).json({ 
                error: 'No text provided for transformation' 
            });
        }

        // Check if API key is available
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'API key not configured on server' 
            });
        }

        // Create the Claude API request
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: buildTransformationPrompt(customText)
                    }
                ]
            })
        });

        if (!claudeResponse.ok) {
            const errorData = await claudeResponse.json();
            console.error('Claude API Error:', errorData);
            return res.status(claudeResponse.status).json({ 
                error: `Claude API Error: ${errorData.error?.message || 'Unknown error'}` 
            });
        }

        const claudeData = await claudeResponse.json();
        const transformedArticle = parseClaudeResponse(claudeData);
        
        res.status(200).json({
            success: true,
            result: transformedArticle
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error during transformation' 
        });
    }
}

// Build transformation prompt for Claude
function buildTransformationPrompt(rawText) {
    return `You are an expert technical writer specializing in cybersecurity knowledge base articles.

Transform this raw technical content into a professional KB article:

RAW CONTENT:
${rawText}

Generate a structured response with:
- A professional title
- Prerequisites (3-5 items)
- Resolution Steps (numbered, specific commands/procedures)
- Verification (how to confirm solution worked)
- Related Articles (3 relevant topics)

Use professional, imperative language. Include exact commands, file paths, and technical specifications where appropriate.

Format your response as a structured article with clear sections using markdown-style headers (**bold** for section titles).

Focus on:
- Converting informal language to professional technical writing
- Adding proper structure and formatting
- Including specific technical details and procedures
- Following cybersecurity KB article best practices`;
}

// Parse Claude's response into structured format
function parseClaudeResponse(claudeData) {
    try {
        const content = claudeData.content[0].text;
        
        // Try to extract structured sections from the response
        const sections = {
            title: extractTitle(content),
            content: content
        };

        return sections;
        
    } catch (error) {
        console.error('Failed to parse Claude response:', error);
        return {
            title: "Transformation Complete",
            content: "The article has been processed, but there was an issue with formatting the response."
        };
    }
}

// Extract title from Claude's response
function extractTitle(content) {
    // Look for common title patterns
    const titlePatterns = [
        /^#\s+(.+)$/m,
        /^\*\*(.+)\*\*$/m,
        /^Title:\s*(.+)$/m
    ];
    
    for (const pattern of titlePatterns) {
        const match = content.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    
    // Fallback title
    return "Professional KB Article";
}