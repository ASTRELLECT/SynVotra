@router.post("/attendance/clock-in")
@requires_auth(role="employee")
def clock_in(request: Request):
    user_id = request.user.id
    if already_clocked_in(user_id):
        return {"error": "Already clocked in"}, 400
    save_clock_in_time(user_id, current_time())
    return {"message": "Clocked in successfully"}

@router.post("/attendance/clock-out")
@requires_auth(role="employee")
def clock_out(request: Request):
    user_id = request.user.id
    if not clock_in_exists(user_id):
        return {"error": "No clock-in record found"}, 400
    save_clock_out_time(user_id, current_time())
    calculate_total_hours(user_id)
    return {"message": "Clocked out successfully"}
