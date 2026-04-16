from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import date
import os
import io
import qrcode

# --------------------------------------------------
# LOAD ENV
# --------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
LOCAL_IP = os.getenv("LOCAL_IP", "localhost")

# Ensure required environment variables are set
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

if not ADMIN_TOKEN:
    raise RuntimeError("ADMIN_TOKEN must be set in .env")

# Create Supabase client and password context for hashing
sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --------------------------------------------------
# APP
# --------------------------------------------------
app = FastAPI(title="Restaurant Ordering API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all during development
    allow_credentials=False,  # must be False when using *
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------------------------------------
# HELPERS
# --------------------------------------------------
def get_setting(key: str, default=None):
    """
    Read a setting from the `settings` table.
    Returns the setting value or default if not found.
    """
    try:
        result = (
            sb.table("settings")
            .select("value")
            .eq("key", key)
            .single()
            .execute()
        )
        if result.data and "value" in result.data:
            return result.data["value"]
        return default
    except Exception:
        return default

def require_admin(x_token: str = Header(...)):
    """
    Simple admin auth using x-token header.
    Example request header:
        x-token: your_admin_token
    """
    if x_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")

def get_loyalty_threshold() -> int:
    """
    Get the loyalty points threshold for reward redemption.
    """
    value = get_setting("loyalty_threshold", 500)
    try:
        return int(value)
    except (TypeError, ValueError):
        return 500

def get_loyalty_reward() -> str:
    """
    Get the loyalty reward description.
    """
    return str(get_setting("loyalty_reward", "a free dessert"))

def get_restaurant_name() -> str:
    """
    Get the restaurant name from settings.
    """
    return str(get_setting("restaurant_name", "My Restaurant"))

# def verify_owner_password(plain_password: str) -> bool:
#     """
#     Expects the DB to store a bcrypt-hashed password in settings.key = owner_password
#     Verifies the provided password against the stored hash.
#     """
#     hashed_password = get_setting("owner_password")
#     if not hashed_password:
#         return False
#     try:
#         return pwd_context.verify(plain_password, hashed_password)
#     except Exception:
#         return False
    
def verify_owner_password(plain_password: str) -> bool:
    hashed_password = get_setting("owner_password")
    print("Entered password:", repr(plain_password))
    print("Hash from DB:", repr(hashed_password))

    if not hashed_password:
        print("No owner_password found")
        return False

    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print("Verify result:", result)
        return result
    except Exception as e:
        print("Verify error:", e)
        return False

def add_points(phone: str, points: int):
    """
    Adds loyalty points to a customer.
    Also increments visits only once per day if the table supports `last_visit_date`.
    """
    today = str(date.today())

    existing = (
        sb.table("loyalty_customers")
        .select("*")
        .eq("phone", phone)
        .execute()
    )

    if existing.data:
        customer = existing.data[0]

        new_points = int(customer.get("total_points", 0)) + points
        new_visits = int(customer.get("total_visits", 0))
        update_payload = {"total_points": new_points}

        # Only increment visits if last_visit_date is different from today
        last_visit_date = customer.get("last_visit_date")
        if last_visit_date != today:
            new_visits += 1
            update_payload["total_visits"] = new_visits
            update_payload["last_visit_date"] = today

        sb.table("loyalty_customers").update(update_payload).eq("id", customer["id"]).execute()
    else:
        payload = {
            "phone": phone,
            "total_points": points,
            "total_visits": 1,
        }

        # Include this only if your table has this column
        payload["last_visit_date"] = today

        sb.table("loyalty_customers").insert(payload).execute()



# --------------------------------------------------
# MODELS
# --------------------------------------------------
class LoginIn(BaseModel):
    password: str = Field(..., min_length=1)

class OrderItemIn(BaseModel):
    item_id: str

class OrderIn(BaseModel):
    table_number: str = Field(..., min_length=1)
    items: List[OrderItemIn] = Field(..., min_length=1)
    customer_phone: Optional[str] = None

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = ""
    price: float = Field(..., gt=0)
    category_id: str
    image_url: str = ""
    is_special: bool = False

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    is_available: Optional[bool] = None
    is_special: Optional[bool] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)

# --------------------------------------------------
# HEALTH
# --------------------------------------------------
@app.get("/")
async def root():
    """
    Health check endpoint.
    """
    return {"ok": True, "service": "restaurant-api"}

# --------------------------------------------------
# MENU
# --------------------------------------------------
@app.get("/menu")
async def get_menu():
    """
    Get the menu with categories and available items.
    """
    try:
        categories = (
            sb.table("categories")
            .select("*")
            .order("sort_order")
            .execute()
        )

        items = (
            sb.table("menu_items")
            .select("*")
            .eq("is_available", True)
            .execute()
        )

        # Group items by category
        grouped = {}
        for item in items.data or []:
            category_id = item["category_id"]
            grouped.setdefault(category_id, []).append(item)

        return {
            "restaurant_name": get_restaurant_name(),
            "categories": categories.data or [],
            "items": grouped,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load menu: {str(e)}")

# --------------------------------------------------
# ORDERS
# --------------------------------------------------
@app.post("/orders")
async def create_order(body: OrderIn):
    """
    Create a new order.
    """
    try:
        item_ids = [i.item_id for i in body.items]

        if not item_ids:
            raise HTTPException(status_code=400, detail="Order must contain at least one item")

        menu_items_result = (
            sb.table("menu_items")
            .select("id, name, price, is_available")
            .in_("id", item_ids)
            .execute()
        )

        db_items = menu_items_result.data or []

        if len(db_items) != len(item_ids):
            raise HTTPException(status_code=400, detail="One or more menu items do not exist")

        # Check for unavailable items
        unavailable = [item["name"] for item in db_items if not item.get("is_available", False)]
        if unavailable:
            raise HTTPException(
                status_code=400,
                detail=f"These items are unavailable: {', '.join(unavailable)}"
            )

        # Preserve original order and allow duplicate items
        db_items_by_id = {item["id"]: item for item in db_items}
        ordered_items = [db_items_by_id[item_id] for item_id in item_ids]

        total = round(sum(float(item["price"]) for item in ordered_items), 2)

        # Insert order into database
        order_result = (
            sb.table("orders")
            .insert({
                "table_number": body.table_number,
                "customer_phone": body.customer_phone,
                "total_amount": total,
                "status": "pending",
            })
            .execute()
        )

        if not order_result.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        order = order_result.data[0]

        # Insert order items
        order_items_payload = [
            {
                "order_id": order["id"],
                "item_name": item["name"],
                "quantity": 1,
                "unit_price": item["price"],
            }
            for item in ordered_items
        ]

        order_items_result = sb.table("order_items").insert(order_items_payload).execute()

        if order_items_result is None:
            raise HTTPException(status_code=500, detail="Failed to create order items")

        # Add loyalty points if customer phone is provided
        if body.customer_phone:
            add_points(body.customer_phone, int(total * 10))

        return {
            "order_id": order["id"],
            "status": "received",
            "total": total,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@app.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: StatusUpdate,
    admin=Depends(require_admin),
):
    """
    Update the status of an order. Admin only.
    """
    allowed_statuses = {"pending", "preparing", "ready", "done", "cancelled"}

    if body.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {', '.join(sorted(allowed_statuses))}"
        )

    try:
        result = (
            sb.table("orders")
            .update({"status": body.status})
            .eq("id", order_id)
            .execute()
        )

        if result.data is not None and len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"ok": True, "order_id": order_id, "status": body.status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update order status: {str(e)}")

@app.get("/orders/active")
async def active_orders(admin=Depends(require_admin)):
    """
    Get all active (not done or cancelled) orders. Admin only.
    """
    try:
        result = (
            sb.table("orders")
            .select("*, order_items(*)")
            .neq("status", "done")
            .neq("status", "cancelled")
            .order("created_at", desc=False)
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch active orders: {str(e)}")

# --------------------------------------------------
# LOYALTY
# --------------------------------------------------
@app.get("/loyalty")
async def get_loyalty(phone: str = Query(..., min_length=1)):
    """
    Get loyalty info for a customer by phone number.
    """
    threshold = get_loyalty_threshold()
    reward = get_loyalty_reward()

    try:
        result = (
            sb.table("loyalty_customers")
            .select("*")
            .eq("phone", phone)
            .execute()
        )

        if not result.data:
            return {
                "points": 0,
                "visits": 0,
                "threshold": threshold,
                "reward": reward,
                "can_redeem": False,
            }

        customer = result.data[0]
        points = int(customer.get("total_points", 0))
        visits = int(customer.get("total_visits", 0))

        return {
            "points": points,
            "visits": visits,
            "threshold": threshold,
            "reward": reward,
            "can_redeem": points >= threshold,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch loyalty info: {str(e)}")

@app.post("/loyalty/redeem")
async def redeem_loyalty(phone: str = Query(..., min_length=1)):
    """
    Redeem loyalty reward for a customer if they have enough points.
    """
    threshold = get_loyalty_threshold()
    reward = get_loyalty_reward()

    try:
        result = (
            sb.table("loyalty_customers")
            .select("*")
            .eq("phone", phone)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Customer not found")

        customer = result.data
        current_points = int(customer.get("total_points", 0))

        if current_points < threshold:
            raise HTTPException(status_code=400, detail="Not enough points")

        new_points = current_points - threshold

        sb.table("loyalty_customers").update(
            {"total_points": new_points}
        ).eq("id", customer["id"]).execute()

        return {
            "success": True,
            "reward": reward,
            "points_remaining": new_points,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to redeem reward: {str(e)}")

# --------------------------------------------------
# OWNER / ADMIN
# --------------------------------------------------
@app.post("/manage/login")
async def owner_login(body: LoginIn):
    """
    Owner/admin login endpoint.
    """
    if not verify_owner_password(body.password):
        raise HTTPException(status_code=401, detail="Wrong password")

    return {
        "ok": True,
        "token": ADMIN_TOKEN,
        "name": get_restaurant_name(),
    }

@app.post("/manage/items")
async def add_item(body: ItemCreate, admin=Depends(require_admin)):
    """
    Add a new menu item. Admin only.
    """
    try:
        result = (
            sb.table("menu_items")
            .insert({
                "name": body.name,
                "description": body.description,
                "price": body.price,
                "category_id": body.category_id,
                "image_url": body.image_url,
                "is_special": body.is_special,
                "is_available": True,
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create menu item")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item: {str(e)}")

@app.patch("/manage/items/{item_id}")
async def update_item(item_id: str, body: ItemUpdate, admin=Depends(require_admin)):
    """
    Update a menu item. Admin only.
    """
    update_data = body.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    try:
        result = (
            sb.table("menu_items")
            .update(update_data)
            .eq("id", item_id)
            .execute()
        )

        if result.data is not None and len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"ok": True, "item_id": item_id, "updated_fields": list(update_data.keys())}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")

@app.delete("/manage/items/{item_id}")
async def delete_item(item_id: str, admin=Depends(require_admin)):
    """
    Delete a menu item. Admin only.
    """
    try:
        result = sb.table("menu_items").delete().eq("id", item_id).execute()

        if result.data is not None and len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"ok": True, "item_id": item_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

# --------------------------------------------------
# QR CODE
# --------------------------------------------------
@app.get("/qr")
async def get_qr():
    """
    Generate a QR code for the frontend URL.
    """
    try:
        url = FRONTEND_URL if FRONTEND_URL else f"http://{LOCAL_IP}:3000"

        qr = qrcode.QRCode(
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")

        return Response(content=buf.getvalue(), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")
    
def verify_owner_password(plain_password: str) -> bool:
    hashed_password = get_setting("owner_password")

    print("Entered:", plain_password)
    print("From DB:", hashed_password)

    return pwd_context.verify(plain_password, hashed_password)