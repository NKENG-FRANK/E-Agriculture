# confirm_user.py this file is OMLY FOR DEVELOPMENT AND SHOULD BE DESTROYED IN A PRODUCTION ENVIRONMENT  NB IS YOAN TALKING TO ANY FUTURE DEVELOPER READING THIS CODE, PLEASE DO NOT USE THIS FILE IN PRODUCTION, IT IS ONLY FOR DEVELOPMENT PURPOSES TO CONFIRM A USER WITHOUT HAVING TO CLICK THE CONFIRMATION LINK IN THE EMAIL. IN PRODUCTION, YOU SHOULD IMPLEMENT A PROPER EMAIL CONFIRMATION FLOW.
from supabase import create_client
from core.config import settings

# Use SERVICE_ROLE key (never anon key)
supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

user_email = "tabouguiangnowa.yoancabrel@ictuniversity.edu.cm"

# Fetch the user ID by email
users = supabase_admin.auth.admin.list_users()
user = next((u for u in users if u.email == user_email), None)
if not user:
    print(f"User {user_email} not found.")
    exit(1)

# Confirm the user
supabase_admin.auth.admin.update_user_by_id(user.id, {"email_confirm": True})
print(f"User {user_email} has been confirmed.")