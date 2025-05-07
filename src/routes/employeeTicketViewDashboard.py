# Route: Employee Ticket Dashboard
@router.get("/tickets/dashboard")
@requires_auth(role="employee")
def get_ticket_dashboard(request: Request,
                            status: Optional[List[str]] = None,
                            department: Optional[str] = None,
                            start_date: Optional[date] = None,
                            end_date: Optional[date] = None):
    """
    1. Extract employee_id from request.user
    2. Parse and validate optional filters:
        - status list (e.g. ["Open","In Progress","Pending"])
        - department ("IT" or "HR")
        - date range (created_at or updated_at between start_date and end_date)
    3. Build query for Ticket records where ticket.employee_id == employee_id
        - If status filter provided, add WHERE status IN status_list
        - If department filter provided, add WHERE department == department
        - If date range provided, add WHERE created_at BETWEEN start_date AND end_date
    4. Execute query to retrieve:
        - ticket_id, title, department, status, created_at, updated_at
    5. For each ticket fetched:
        a. Query TicketHistory where history.ticket_id == ticket_id
        b. Collect history entries: { timestamp, author_role, author_id, message }
    6. Organize tickets in the response:
        - Group by status or department if requested
        - Include history array for each ticket
    7. Construct JSON payload:
        {
            dashboard: {
            filters_applied: { status, department, date_range },
            tickets: [
                {
                ticket_id,
                title,
                department,
                status,
                created_at,
                updated_at,
                history: [ { timestamp, author_role, message }, … ]
                },
                …
            ]
            }
        }
    8. Return payload in JSON with HTTP 200.
    """
