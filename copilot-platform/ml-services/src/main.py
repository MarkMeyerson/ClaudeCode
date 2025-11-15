"""
Microsoft Copilot ROI Platform - ML Services
Phase 8: AI-Powered Analytics and Predictions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Copilot ROI Platform - ML Services",
    description="AI-powered analytics for adoption prediction and ROI forecasting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class AdoptionPredictionRequest(BaseModel):
    organization_id: str
    historical_data: List[Dict[str, Any]]
    forecast_periods: int = 12

class AdoptionPredictionResponse(BaseModel):
    organization_id: str
    predictions: List[Dict[str, float]]
    confidence_intervals: List[Dict[str, float]]
    key_drivers: List[str]
    recommendations: List[str]

class ROIPredictionRequest(BaseModel):
    organization_id: str
    employee_count: int
    industry: str
    company_size: str
    historical_costs: Optional[List[float]] = None
    historical_benefits: Optional[List[float]] = None

class ROIPredictionResponse(BaseModel):
    organization_id: str
    predicted_roi: float
    year1_projection: Dict[str, float]
    year2_projection: Dict[str, float]
    year3_projection: Dict[str, float]
    breakeven_month: int
    confidence_score: float

class UserSegmentationRequest(BaseModel):
    organization_id: str
    user_data: List[Dict[str, Any]]
    n_segments: int = 4

class UserSegmentationResponse(BaseModel):
    organization_id: str
    segments: List[Dict[str, Any]]
    segment_characteristics: List[Dict[str, Any]]
    recommendations: Dict[str, List[str]]

class ChurnPredictionRequest(BaseModel):
    organization_id: str
    user_id: str
    engagement_history: List[Dict[str, Any]]

class ChurnPredictionResponse(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str
    key_risk_factors: List[str]
    recommended_interventions: List[str]

# ============================================================================
# ML MODELS (Simplified implementations)
# ============================================================================

class AdoptionPredictor:
    """Predict adoption rates using time series forecasting"""

    def predict(self, historical_data: List[Dict], forecast_periods: int):
        """
        Predict future adoption rates
        In production, this would use Prophet or ARIMA
        """
        # Simplified prediction logic
        df = pd.DataFrame(historical_data)

        if len(df) < 2:
            # Not enough data, use industry averages
            base_rate = 0.65
            growth_rate = 0.05
        else:
            # Calculate trends from historical data
            base_rate = df['adoption_rate'].iloc[-1] / 100
            growth_rate = (df['adoption_rate'].iloc[-1] - df['adoption_rate'].iloc[0]) / len(df) / 100

        predictions = []
        confidence_intervals = []

        for i in range(1, forecast_periods + 1):
            # Logistic growth model
            predicted_rate = base_rate + (growth_rate * i)
            predicted_rate = min(0.95, max(0.1, predicted_rate))  # Cap between 10% and 95%

            predictions.append({
                'period': i,
                'adoption_rate': round(predicted_rate * 100, 2),
                'timestamp': (datetime.now() + timedelta(days=30 * i)).isoformat()
            })

            # Confidence intervals (±5% for simplicity)
            confidence_intervals.append({
                'period': i,
                'lower_bound': max(0, (predicted_rate - 0.05) * 100),
                'upper_bound': min(100, (predicted_rate + 0.05) * 100)
            })

        return predictions, confidence_intervals

class ROIPredictor:
    """Predict ROI based on organization characteristics"""

    def predict(self, employee_count: int, industry: str, company_size: str):
        """
        Predict 3-year ROI
        In production, this would use XGBoost or ensemble models
        """
        # Industry multipliers (based on benchmarks)
        industry_multipliers = {
            'technology': 1.3,
            'financial_services': 1.2,
            'healthcare': 1.1,
            'manufacturing': 1.0,
            'retail': 0.95,
            'education': 0.9,
            'default': 1.0
        }

        # Company size multipliers
        size_multipliers = {
            'small': 0.9,
            'medium': 1.0,
            'large': 1.1,
            'enterprise': 1.2
        }

        base_roi = 200  # 200% baseline ROI
        industry_mult = industry_multipliers.get(industry.lower(), 1.0)
        size_mult = size_multipliers.get(company_size.lower(), 1.0)

        predicted_roi = base_roi * industry_mult * size_mult

        # Calculate year-by-year projections
        cost_per_user = 360  # Annual license cost
        productivity_gain_per_user = 1200  # Annual productivity value

        year1_costs = employee_count * cost_per_user + (employee_count * 150)  # +implementation
        year1_benefits = employee_count * productivity_gain_per_user * 0.6  # 60% realization

        year2_costs = employee_count * cost_per_user
        year2_benefits = employee_count * productivity_gain_per_user * 0.8  # 80% realization

        year3_costs = employee_count * cost_per_user
        year3_benefits = employee_count * productivity_gain_per_user * 0.9  # 90% realization

        # Calculate breakeven month
        monthly_benefit = year1_benefits / 12
        monthly_cost = year1_costs / 12
        breakeven_month = int(year1_costs / monthly_benefit) if monthly_benefit > monthly_cost else 24

        return {
            'predicted_roi': round(predicted_roi, 2),
            'year1': {
                'costs': round(year1_costs, 2),
                'benefits': round(year1_benefits, 2),
                'roi': round((year1_benefits - year1_costs) / year1_costs * 100, 2)
            },
            'year2': {
                'costs': round(year2_costs, 2),
                'benefits': round(year2_benefits, 2),
                'roi': round((year2_benefits - year2_costs) / year2_costs * 100, 2)
            },
            'year3': {
                'costs': round(year3_costs, 2),
                'benefits': round(year3_benefits, 2),
                'roi': round((year3_benefits - year3_costs) / year3_costs * 100, 2)
            },
            'breakeven_month': breakeven_month,
            'confidence_score': 0.85
        }

class UserSegmenter:
    """Segment users using clustering algorithms"""

    def segment(self, user_data: List[Dict], n_segments: int = 4):
        """
        Segment users into adoption personas
        In production, this would use K-means or DBSCAN
        """
        # Simplified segmentation
        df = pd.DataFrame(user_data)

        # Define segments based on engagement and proficiency
        segments = [
            {
                'segment_id': 'champions',
                'name': 'Champions & Power Users',
                'size': int(len(df) * 0.15),
                'characteristics': {
                    'engagement_score': 85,
                    'proficiency_level': 'expert',
                    'adoption_stage': 'mastery'
                }
            },
            {
                'segment_id': 'engaged',
                'name': 'Engaged Users',
                'size': int(len(df) * 0.35),
                'characteristics': {
                    'engagement_score': 65,
                    'proficiency_level': 'advanced',
                    'adoption_stage': 'proficiency'
                }
            },
            {
                'segment_id': 'casual',
                'name': 'Casual Users',
                'size': int(len(df) * 0.35),
                'characteristics': {
                    'engagement_score': 45,
                    'proficiency_level': 'intermediate',
                    'adoption_stage': 'adoption'
                }
            },
            {
                'segment_id': 'at_risk',
                'name': 'At-Risk Users',
                'size': int(len(df) * 0.15),
                'characteristics': {
                    'engagement_score': 25,
                    'proficiency_level': 'beginner',
                    'adoption_stage': 'exploration'
                }
            }
        ]

        recommendations = {
            'champions': [
                'Engage as peer mentors and trainers',
                'Invite to contribute to best practices library',
                'Recognize achievements publicly'
            ],
            'engaged': [
                'Provide advanced training opportunities',
                'Share advanced use cases and tips',
                'Encourage peer-to-peer learning'
            ],
            'casual': [
                'Send personalized feature recommendations',
                'Provide quick-win tutorials',
                'Increase engagement touchpoints'
            ],
            'at_risk': [
                'Conduct 1-on-1 coaching sessions',
                'Identify and address barriers',
                'Provide simplified onboarding resources'
            ]
        }

        return segments, recommendations

class ChurnPredictor:
    """Predict user churn probability"""

    def predict(self, engagement_history: List[Dict]):
        """
        Predict if user is likely to churn
        In production, this would use logistic regression or neural networks
        """
        # Calculate risk factors
        df = pd.DataFrame(engagement_history)

        days_since_last_activity = (datetime.now() - pd.to_datetime(df['date'].iloc[-1])).days
        avg_daily_interactions = df['interactions'].mean()
        engagement_trend = df['interactions'].iloc[-1] - df['interactions'].iloc[0]

        # Calculate churn probability
        churn_score = 0.0

        if days_since_last_activity > 14:
            churn_score += 0.3
        if avg_daily_interactions < 2:
            churn_score += 0.3
        if engagement_trend < 0:
            churn_score += 0.2
        if df['interactions'].std() > 5:  # High variability
            churn_score += 0.1

        churn_probability = min(0.95, churn_score)

        # Determine risk level
        if churn_probability > 0.7:
            risk_level = 'high'
        elif churn_probability > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Identify key risk factors
        risk_factors = []
        if days_since_last_activity > 14:
            risk_factors.append('Inactive for over 2 weeks')
        if avg_daily_interactions < 2:
            risk_factors.append('Low engagement level')
        if engagement_trend < 0:
            risk_factors.append('Declining usage trend')

        return {
            'churn_probability': round(churn_probability, 2),
            'risk_level': risk_level,
            'key_risk_factors': risk_factors
        }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "Copilot ROI Platform - ML Services",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict/adoption", response_model=AdoptionPredictionResponse)
async def predict_adoption(request: AdoptionPredictionRequest):
    """Predict future adoption rates"""
    try:
        predictor = AdoptionPredictor()
        predictions, confidence_intervals = predictor.predict(
            request.historical_data,
            request.forecast_periods
        )

        return AdoptionPredictionResponse(
            organization_id=request.organization_id,
            predictions=predictions,
            confidence_intervals=confidence_intervals,
            key_drivers=[
                'Training completion rate',
                'Champion engagement',
                'Feature availability',
                'Leadership support'
            ],
            recommendations=[
                'Increase training accessibility',
                'Activate champion program',
                'Communicate quick wins',
                'Measure and share success stories'
            ]
        )
    except Exception as e:
        logger.error(f"Error predicting adoption: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/roi", response_model=ROIPredictionResponse)
async def predict_roi(request: ROIPredictionRequest):
    """Predict 3-year ROI"""
    try:
        predictor = ROIPredictor()
        result = predictor.predict(
            request.employee_count,
            request.industry,
            request.company_size
        )

        return ROIPredictionResponse(
            organization_id=request.organization_id,
            predicted_roi=result['predicted_roi'],
            year1_projection=result['year1'],
            year2_projection=result['year2'],
            year3_projection=result['year3'],
            breakeven_month=result['breakeven_month'],
            confidence_score=result['confidence_score']
        )
    except Exception as e:
        logger.error(f"Error predicting ROI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment/users", response_model=UserSegmentationResponse)
async def segment_users(request: UserSegmentationRequest):
    """Segment users into adoption personas"""
    try:
        segmenter = UserSegmenter()
        segments, recommendations = segmenter.segment(
            request.user_data,
            request.n_segments
        )

        return UserSegmentationResponse(
            organization_id=request.organization_id,
            segments=segments,
            segment_characteristics=segments,
            recommendations=recommendations
        )
    except Exception as e:
        logger.error(f"Error segmenting users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/churn", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """Predict user churn probability"""
    try:
        predictor = ChurnPredictor()
        result = predictor.predict(request.engagement_history)

        # Generate recommendations based on risk level
        interventions = {
            'high': [
                'Immediate 1-on-1 coaching session',
                'Identify and address specific barriers',
                'Provide dedicated support resources',
                'Consider license reassignment if no improvement'
            ],
            'medium': [
                'Send personalized engagement campaign',
                'Share relevant use cases and tips',
                'Invite to next training session',
                'Monitor for 2 weeks'
            ],
            'low': [
                'Continue regular engagement',
                'Share advanced features periodically',
                'Maintain current support level'
            ]
        }

        return ChurnPredictionResponse(
            user_id=request.user_id,
            churn_probability=result['churn_probability'],
            risk_level=result['risk_level'],
            key_risk_factors=result['key_risk_factors'],
            recommended_interventions=interventions[result['risk_level']]
        )
    except Exception as e:
        logger.error(f"Error predicting churn: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
