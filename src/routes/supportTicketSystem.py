# Route: Submit a new support ticket (Employee)
@router.post("/tickets")
@requires_auth(role="employee")
def submit_ticket(request: Request, ticket_data: TicketCreateSchema):
    """
    1. Extract employee_id from request.user
    2. Validate ticket_data (title, description, department [IT or HR], optional attachments)
    3. Create a new Ticket record in the database with status = "Open"
        - Fields: employee_id, title, description, department, created_at, status
    4. Return JSON:
        {
            ticket_id,
            message: "Ticket submitted successfully"
        }
    """

# Route: View my submitted tickets (Employee)
@router.get("/tickets/my")
@requires_auth(role="employee")
def view_my_tickets(request: Request):
    """
    1. Extract employee_id from request.user
    2. Query database for tickets where ticket.employee_id == employee_id
    3. For each ticket, include:
        - ticket_id, title, department, status, created_at, last_updated_at
        - actions: if status is "Open" or "Pending", allow cancel
    4. Return JSON list of tickets
    """

# Route: Cancel a ticket (Employee)
@router.delete("/tickets/{ticket_id}")
@requires_auth(role="employee")
def cancel_ticket(request: Request, ticket_id: int):
    """
    1. Extract employee_id from request.user
    2. Fetch ticket by ticket_id
    3. Verify ticket.employee_id == employee_id and status in ["Open", "Pending"]
        - If not allowed, return 403 or 400
    4. Update ticket.status = "Cancelled", updated_at = current_time()
    5. Return JSON:
        {
            message: "Ticket cancelled successfully"
        }
    """

# Route: List all tickets with optional category filter (Admin)
@router.get("/admin/tickets")
@requires_auth(role="admin")
def list_tickets(request: Request, department: Optional[str] = None):
    """
    1. Parse optional department filter ("IT" or "HR")
    2. Build query for Ticket records:
        - If department provided, filter by Ticket.department == department
    3. Execute query and group or sort as needed
    4. For each ticket, include:
        - ticket_id, employee_id, title, department, status, created_at, assigned_to
    5. Return JSON list of tickets
    """

# Route: Get details and update a specific ticket (Admin)
@router.get("/admin/tickets/{ticket_id}")
@requires_auth(role="admin")
def get_ticket_details(request: Request, ticket_id: int):
    """
    1. Fetch ticket by ticket_id
    2. If not found, return 404
    3. Fetch any conversation entries or admin notes linked to ticket
    4. Return JSON:
        {
            ticket_id, employee_id, title, description, department,
            status, created_at, updated_at,
            history: [ { timestamp, author, message } ]
        }
    """

@router.patch("/admin/tickets/{ticket_id}")
@requires_auth(role="admin")
def update_ticket(request: Request, ticket_id: int, update_data: TicketUpdateSchema):
    """
    1. Fetch ticket by ticket_id
    2. If not found, return 404
    3. Validate update_data (status change, add comment/note, assign to self or teammate)
    4. Apply updates:
        - ticket.status = update_data.status (if provided)
        - ticket.assigned_to = update_data.assigned_to (if provided)
    5. If update_data.note provided:
        - Create a TicketHistory record with author=admin_id, message=note, timestamp=current_time()
    6. Save changes and updated_at timestamp
    7. Return JSON:
        {
            message: "Ticket updated successfully"
        }
    """