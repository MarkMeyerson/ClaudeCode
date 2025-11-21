import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_name, email, company_size, industry } = req.body;

    // Validate required fields
    if (!company_name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, return a mock assessment
    // In production, this would process the assessment and store in DB
    const assessment = {
      id: Math.random().toString(36).substr(2, 9),
      company_name,
      email,
      company_size,
      industry,
      status: 'completed',
      results: {
        strategic_clarity: {
          score: 72,
          description: 'Good understanding of AI strategy'
        },
        team_capability: {
          score: 65,
          description: 'Team has foundational AI knowledge'
        },
        governance_readiness: {
          score: 58,
          description: 'Governance framework needs development'
        },
        technical_infrastructure: {
          score: 70,
          description: 'Solid technical foundation'
        },
        executive_alignment: {
          score: 68,
          description: 'Leadership is aligned on AI initiatives'
        }
      },
      created_at: new Date().toISOString()
    };

    // TODO: Save to database
    // const query = 'INSERT INTO assessments (company_name, email, company_size, industry, results) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    // const result = await pool.query(query, [company_name, email, company_size, industry, JSON.stringify(assessment.results)]);

    return res.status(200).json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('Assessment error:', error);
    return res.status(500).json({
      error: 'Failed to process assessment',
      message: error.message
    });
  }
}
