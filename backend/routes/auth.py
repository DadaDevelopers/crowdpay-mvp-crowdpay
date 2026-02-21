import os
from flask import Blueprint, request, jsonify
import logging
import re
from services import get_supabase_client
from . import auth_bp
from pydantic import BaseModel, EmailStr, validator

logger = logging.getLogger(__name__)
supabase = get_supabase_client()


class SignUpRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirmation: str

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens and underscores')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # Check for lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # Check for digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        
        # Check for special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*...)')
        
        return v

    @validator('password_confirmation')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


def session_to_dict(session):
    """Convert Supabase Session object to JSON-serializable dict"""
    if session is None:
        return None
    return {
        "access_token": getattr(session, "access_token", None),
        "refresh_token": getattr(session, "refresh_token", None),
        "expires_at": getattr(session, "expires_at", None),
        "token_type": getattr(session, "token_type", None)
    }

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user using Supabase Auth with duplicate check"""
    try:
        data = request.get_json()
        
        # Validate input data
        try:
            signup_data = SignUpRequest(**data)
        except ValueError as ve:
            # Return validation errors with specific field information
            error_msg = str(ve)
            if "username" in error_msg.lower():
                field = "username"
            elif "password" in error_msg.lower() and "not match" not in error_msg.lower():
                field = "password"
            elif "not match" in error_msg.lower():
                field = "password_confirmation"
            elif "email" in error_msg.lower():
                field = "email"
            else:
                field = "general"
            
            return jsonify({
                'error': error_msg,
                'field': field
            }), 400
            
        # Check if email already exists in users table
        existing_email = supabase.table("users").select("*").eq("email", signup_data.email).execute()
        if existing_email.data:
            return jsonify({
                'error': 'Email already exists',
                'field': 'email'
            }), 409
            
        # Check if username already exists
        try:
            existing_username = supabase.table("users").select("*").eq("username", signup_data.username).execute()
            if existing_username.data:
                return jsonify({
                    'error': 'Username already taken',
                    'field': 'username'
                }), 409
        except Exception as username_error:
            logger.warning(f"Username check skipped: {str(username_error)}")
        
        # Determine the redirect URL based on environment
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
        
        # Create user in Supabase Auth with correct redirect
        res = supabase.auth.sign_up({
            "email": signup_data.email,
            "password": signup_data.password,
            "options": {
                "data": {
                    "username": signup_data.username
                },
                # IMPORTANT: No /app prefix
                "email_redirect_to": f"{frontend_url}/auth/callback"
            }
        })
        
        if res.user is None:
            return jsonify({
                'error': 'Registration failed. Please try again.',
                'field': 'general'
            }), 400
        
        # Save extra user info in your users table
        user_data = {
            "id": res.user.id,
            "email": signup_data.email,
            "username": signup_data.username,
            "email_verified": False  # Track confirmation status
        }
        
        try:
            supabase.table("users").insert(user_data).execute()
        except Exception as db_error:
            logger.error(f"Failed to save user data: {str(db_error)}")
        
        # Check if user has a session (they can sign in)
        has_session = res.session is not None
        
        return jsonify({
            "message": "Account created successfully! Please check your email to verify your account.",
            "user": user_data,
            "session": session_to_dict(res.session) if res.session else None,
            "email_confirmation_sent": True,
            "email_verified": False
        }), 201
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        
        error_message = str(e)
        
        if "User already registered" in error_message:
            return jsonify({
                'error': 'This email is already registered',
                'field': 'email'
            }), 409
        else:
            return jsonify({
                'error': 'Registration failed. Please try again.',
                'field': 'general'
            }), 500

@auth_bp.route('/signin', methods=['POST'])
def signin():
    """Sign in an existing user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'error': 'Email and password are required',
                'field': 'general'
            }), 400
        
        # Sign in with Supabase
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if res.user is None or res.session is None:
            return jsonify({
                'error': 'Invalid email or password',
                'field': 'general'
            }), 401
        
        # Get user data from your users table
        user_data = supabase.table("users").select("*").eq("id", res.user.id).execute()
        
        user_info = {
            "id": res.user.id,
            "email": res.user.email,
            "username": user_data.data[0].get("username") if user_data.data else res.user.email.split("@")[0],
            "email_verified": user_data.data[0].get("email_verified", False) if user_data.data else False
        }
        
        return jsonify({
            "message": "Sign in successful",
            "user": user_info,
            "session": session_to_dict(res.session)
        }), 200
            
    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        return jsonify({
            'error': 'Sign in failed. Please try again.',
            'field': 'general'
        }), 500
        
#resend verification email
@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                'error': 'Email is required',
                'field': 'email'
            }), 400
        
        # Get frontend URL
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
        
        # Resend verification email via Supabase
        try:
            supabase.auth.resend({
                "type": "signup",
                "email": email,
                "options": {
                    "email_redirect_to": f"{frontend_url}/auth/callback"
                }
            })
            
            # Update reminder timestamp
            supabase.table("users").update({
                "verification_reminder_sent_at": "now()"
            }).eq("email", email).execute()
            
            return jsonify({
                "message": "Verification email sent! Check your inbox."
            }), 200
            
        except Exception as resend_error:
            logger.error(f"Resend verification error: {str(resend_error)}")
            return jsonify({
                'error': 'Failed to send verification email. Please try again.',
                'field': 'general'
            }), 500
        
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        return jsonify({
            'error': 'Failed to send verification email.',
            'field': 'general'
        }), 500       

# Email confirmation route to handle the redirect from the confirmation email link
@auth_bp.route('/confirm-email', methods=['POST'])
def confirm_email():
    """Confirm user email using token hash"""
    try:
        data = request.get_json()
        token_hash = data.get('token_hash')
        
        if not token_hash:
            return jsonify({
                'error': 'Token hash is required',
                'field': 'general'
            }), 400
        
        # Verify the email with Supabase
        try:
            res = supabase.auth.verify_otp({
                'token_hash': token_hash,
                'type': 'email'
            })
            
            if res.user is None:
                return jsonify({
                    'error': 'Invalid or expired confirmation link',
                    'field': 'general'
                }), 400
            
            # Update user's email_verified status
            try:
                from datetime import datetime
                supabase.table("users").update({
                    "email_verified": True,
                    "email_verified_at": datetime.utcnow().isoformat()
                }).eq("id", res.user.id).execute()
                
                logger.info(f"Email verified for user: {res.user.id}")
            except Exception as db_error:
                logger.warning(f"Failed to update email_verified status: {str(db_error)}")
            
            return jsonify({
                "message": "Email verified successfully!",
                "user": {
                    "id": res.user.id,
                    "email": res.user.email,
                    "email_verified": True
                }
            }), 200
            
        except Exception as verify_error:
            logger.error(f"Email verification error: {str(verify_error)}")
            return jsonify({
                'error': 'Invalid or expired confirmation link',
                'field': 'general'
            }), 400
        
    except Exception as e:
        logger.error(f"Confirm email error: {str(e)}")
        return jsonify({
            'error': 'Email confirmation failed. Please try again.',
            'field': 'general'
        }), 500
        
        
@auth_bp.route('/signout', methods=['POST'])
def signout():
    """Sign out user"""
    try:
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            supabase.auth.sign_out(token)

        return jsonify({'message': 'Signed out successfully'}), 200

    except Exception as e:
        logger.error(f"Signout error: {str(e)}")
        return jsonify({'message': 'Signed out'}), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    try:
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token'}), 401

        token = auth_header.split(' ')[1]
        user_resp = supabase.auth.get_user(token)

        if not user_resp or not user_resp.user:
            return jsonify({'error': 'Invalid token'}), 401

        # Fetch extra user info from users table
        user_data_resp = supabase.table("users").select("*").eq("id", user_resp.user.id).single().execute()
        user_data = user_data_resp.data if user_data_resp.data else {"id": user_resp.user.id, "email": user_resp.user.email}

        return jsonify({'user': user_data}), 200

    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({'error': 'Failed to get user'}), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')

        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400

        result = supabase.auth.refresh_session(refresh_token)

        return jsonify({
            'message': 'Token refreshed',
            'session': session_to_dict(result.session) if result else None
        }), 200

    except Exception as e:
        logger.error(f"Refresh error: {str(e)}")
        return jsonify({'error': 'Failed to refresh token'}), 401


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email via Supabase"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        supabase.auth.reset_password_email(email)

        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }), 200

    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        # Always return success to avoid email enumeration
        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token from email link"""
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        new_password = data.get('new_password')

        if not access_token or not new_password:
            return jsonify({'error': 'Access token and new password are required'}), 400

        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400

        result = supabase.auth.update_user(access_token, {"password": new_password})

        if not result or not result.user:
            return jsonify({'error': 'Failed to reset password. The link may have expired.'}), 400

        return jsonify({'message': 'Password reset successfully'}), 200

    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500


@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get the authenticated user's full profile"""
    try:
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token'}), 401

        token = auth_header.split(' ')[1]
        user_resp = supabase.auth.get_user(token)

        if not user_resp or not user_resp.user:
            return jsonify({'error': 'Invalid token'}), 401

        user_data_resp = supabase.table("users").select("*").eq("id", user_resp.user.id).single().execute()
        user_data = user_data_resp.data if user_data_resp.data else {
            "id": user_resp.user.id,
            "email": user_resp.user.email
        }

        return jsonify({'user': user_data}), 200

    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update the authenticated user's profile"""
    try:
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token'}), 401

        token = auth_header.split(' ')[1]
        user_resp = supabase.auth.get_user(token)

        if not user_resp or not user_resp.user:
            return jsonify({'error': 'Invalid token'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Allowed fields to update
        allowed_fields = [
            'username', 'full_name', 'lightning_address',
            'onchain_address', 'wallet_type', 'email_notifications'
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        # Validate lightning address format if provided
        lightning_address = update_data.get('lightning_address')
        if lightning_address and lightning_address.strip():
            lightning_address = lightning_address.strip()
            # Must be user@domain format or start with LNURL
            if not (re.match(r'^[^@]+@[^@]+\.[^@]+$', lightning_address) or
                    lightning_address.lower().startswith('lnurl')):
                return jsonify({
                    'error': 'Invalid Lightning address. Use user@domain format or LNURL.'
                }), 400
            update_data['lightning_address'] = lightning_address

        # Validate wallet_type if provided
        wallet_type = update_data.get('wallet_type')
        if wallet_type and wallet_type not in ('internal', 'lightning', 'onchain'):
            return jsonify({'error': 'Invalid wallet type'}), 400

        # Update in database
        result = supabase.table("users").update(update_data).eq(
            "id", user_resp.user.id
        ).execute()

        if not result.data:
            return jsonify({'error': 'Failed to update profile'}), 500

        return jsonify({
            'message': 'Profile updated successfully',
            'user': result.data[0]
        }), 200

    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500


@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    """Get all users from the database (admin only - add auth check in production)"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token'}), 401

        token = auth_header.split(' ')[1]
        user_resp = supabase.auth.get_user(token)

        if not user_resp or not user_resp.user:
            return jsonify({'error': 'Invalid token'}), 401

        # Fetch all users from users table
        users_resp = supabase.table("users").select("id, email, username, created_at").execute()
        
        return jsonify({
            'users': users_resp.data,
            'count': len(users_resp.data)
        }), 200

    except Exception as e:
        logger.error(f"Get all users error: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500