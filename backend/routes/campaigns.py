from flask import request, jsonify
from datetime import datetime
import logging
from . import campaigns_bp
from models import Campaign
from services import get_supabase_client
from services.auth import optional_auth, require_auth
from pydantic import ValidationError
import uuid


logger = logging.getLogger(__name__)
supabase = get_supabase_client()

#add/create a new campaign
@campaigns_bp.route('', methods=['POST'])
@require_auth
def create_campaign():
    """Create a new campaign"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Add creator_id from authenticated user
        data['creator_id'] = request.user['id']
        data['creator_email'] = request.user['email']
        
        # Validate and create campaign model
        campaign = Campaign(**data)
        campaign.created_at = datetime.now()
        campaign.updated_at = datetime.now()
        
        # Insert into database
        campaign_data = campaign.to_dict()
        campaign_data.pop('id', None)
        
        response = supabase.table('campaigns').insert(campaign_data).execute()
        
        if not response.data:
            return jsonify({'error': 'Failed to create campaign'}), 500
        
        created_campaign = Campaign.from_dict(response.data[0])
        
        logger.info(f"Campaign created: {created_campaign.id}")
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': created_campaign.dict()
        }), 201
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': 'Validation error', 'details': e.errors()}), 400
    except Exception as e:
        logger.error(f"Error creating campaign: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# retreive/get all campaigns
@campaigns_bp.route('', methods=['GET'])
@optional_auth
def get_campaigns():
    """Get all campaigns with optional filtering"""
    try:
        status = request.args.get('status')
        creator_id = request.args.get('creator_id')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        query = supabase.table('campaigns').select('*')

        # Only fetch active campaigns unless status filter is provided
        if status:
            query = query.eq('status', status)
        else:
            query = query.eq('status', 'active')

        if creator_id:
            query = query.eq('creator_id', creator_id)

        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        campaigns = [Campaign.from_dict(c).dict() for c in response.data]

        return jsonify({
            'campaigns': campaigns,
            'count': len(campaigns),
            'offset': offset,
            'limit': limit
        }), 200

    except Exception as e:
        logger.error(f"Error fetching campaigns: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# get campaign by it's id
@campaigns_bp.route('/<campaign_id>', methods=['GET'])
@optional_auth
def get_campaign(campaign_id):
    """Get a specific campaign by ID"""
    try:
        response = supabase.table('campaigns').select('*').eq(
            'id', campaign_id
        ).single().execute()
        
        if not response.data:
            return jsonify({'error': 'Campaign not found'}), 404
        
        campaign = Campaign.from_dict(response.data)
        
        # Get contribution statistics
        contrib_response = supabase.table('contributions').select(
            'id, amount, payment_status'
        ).eq('campaign_id', campaign_id).execute()
        
        total_contributions = len(contrib_response.data)
        paid_contributions = sum(
            1 for c in contrib_response.data if c['payment_status'] == 'paid'
        )
        
        return jsonify({
            'campaign': campaign.dict(),
            'statistics': {
                'progress_percentage': campaign.progress_percentage(),
                'remaining_amount': campaign.remaining_amount(),
                'total_contributions': total_contributions,
                'paid_contributions': paid_contributions,
                'is_goal_reached': campaign.is_goal_reached()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching campaign: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


#Update campaign info
@campaigns_bp.route('/<campaign_id>', methods=['PUT'])
@require_auth
def update_campaign(campaign_id):
    """Update a campaign"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Check if campaign exists
        existing = supabase.table('campaigns').select('*').eq(
            'id', campaign_id
        ).single().execute()
        if not existing.data:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Verify ownership
        if existing.data['creator_id'] != request.user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update only allowed fields
        allowed_fields = [
            'title', 'description', 'target_amount', 'status', 'end_date'
        ]
        
        update_data = {
            k: v for k, v in data.items() if k in allowed_fields
        }
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updated_at'] = datetime.now().isoformat()

        # Merge with existing data to validate
        campaign_data = {**existing.data, **update_data}
        campaign = Campaign(**campaign_data)    
        
        # Update in database
        response =supabase.table('campaigns').update(
            update_data
        ).eq('id', campaign_id).execute()

        updated_campaign = Campaign.from_dict(response.data[0])  
        logger.info(f"Campaign updated: {campaign_id}") 

        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': updated_campaign.dict()
        }), 200
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': 'Validation error', 'details': e.errors()}), 400
    except Exception as e:
        logger.error(f"Error updating campaign: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

#delete a campaign by id
@campaigns_bp.route('/<campaign_id>', methods=['DELETE'])
@require_auth
def delete_campaign(campaign_id):
    """Permanently delete a campaign"""
    try:
        # Check if campaign exists
        existing = supabase.table('campaigns').select('*').eq('id', campaign_id).single().execute()
        if not existing.data:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Verify ownership
        if existing.data['creator_id'] != request.user['id']:
            return jsonify({'error': 'Unauthorized'}), 403

        # Permanently delete row
        response = supabase.table('campaigns').delete().eq('id', campaign_id).execute()
        
        if not response.data:
            return jsonify({'error': 'Failed to delete campaign'}), 500
        
        logger.info(f"Campaign permanently deleted: {campaign_id}")
        return jsonify({'message': 'Campaign permanently deleted'}), 200

    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# get all contributions made to a campaign
@campaigns_bp.route('/<campaign_id>/contributions', methods=['GET'])
@optional_auth
def get_campaign_contributions(campaign_id):
    """Get all contributions for a campaign"""
    try:
        # Check if campaign exists
        campaign_exists = supabase.table('campaigns').select('id').eq(
            'id', campaign_id
        ).execute()
        
        if not campaign_exists.data:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Get contributions
        response = supabase.table('contributions').select('*').eq(
            'campaign_id', campaign_id
        ).order('created_at', desc=True).execute()
        
        contributions = response.data
        
        # Filter anonymous contributor info
        for contrib in contributions:
            if contrib.get('is_anonymous'):
                contrib['contributor_name'] = 'Anonymous'
                contrib['contributor_email'] = None
        
        return jsonify({
            'contributions': contributions,
            'count': len(contributions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching contributions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
