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
            # Extract field name from pydantic error if possible
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

        # Create user in Supabase Auth with email redirect configuration
        res = supabase.auth.sign_up({
            "email": signup_data.email,
            "password": signup_data.password,
            "options": {
                "data": {
                    "username": signup_data.username
                },
                "email_redirect_to": "http://localhost:8080/email-confirmed"
            }
        })

        if res.user is None:
            return jsonify({
                'error': 'Registration failed. Please try again.',
                'field': 'general'
            }), 400

        # Save extra user info in your users table
        # IMPORTANT: Only save if user was created successfully
        user_data = {
            "id": res.user.id,
            "email": signup_data.email,
            "username": signup_data.username
        }
        
        try:
            supabase.table("users").insert(user_data).execute()
        except Exception as db_error:
            logger.error(f"Failed to save user data: {str(db_error)}")
            # User exists in Auth but not in users table
            # This could happen if email confirmation is required
            # We'll handle this in the email confirmation callback

        # Check if email confirmation is required
        message = "User registered successfully"
        if res.session is None:
            message = "User registered successfully. Please check your email to confirm your account."
        
        return jsonify({
            "message": message,
            "user": user_data,
            "session": session_to_dict(res.session),
            "email_confirmation_required": res.session is None
        }), 201

    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        
        # Better error handling for email sending issues
        error_message = str(e)
        
        if "Error sending confirmation email" in error_message:
            return jsonify({
                'error': 'Failed to send verification email. Please contact support or try again later.',
                'field': 'general',
                'details': 'Email service configuration issue'
            }), 500
        elif "User already registered" in error_message:
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
    """Sign in an existing user using Supabase Auth"""
    try:
        data = request.get_json()
        signin_data = SignInRequest(**data)

        res = supabase.auth.sign_in_with_password({
            "email": signin_data.email,
            "password": signin_data.password
        })

        if res.user is None:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Fetch extra user info from users table
        user_resp = supabase.table("users").select("*").eq("id", res.user.id).single().execute()
        user_data = user_resp.data if user_resp.data else {"id": res.user.id, "email": res.user.email}

        return jsonify({
            "message": "Signed in successfully",
            "user": user_data,
            "session": session_to_dict(res.session)
        }), 200

    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        return jsonify({'error': 'Invalid credentials'}), 401


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