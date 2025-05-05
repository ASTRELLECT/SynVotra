@router.post("/referral/submit")
@requires_auth(role="employee")
def submit_referral(request: Request, referral: ReferralSchema):
    user_id = request.user.id
    referral_id = save_referral(user_id, referral)
    return {"message": "Referral submitted", "referral_id": referral_id}

@router.get("/referral/status")
@requires_auth(role="employee")
def view_referral_status(request: Request):
    user_id = request.user.id
    referrals = get_referrals_by_user(user_id)
    return {"referrals": referrals}

@router.post("/referral/{referral_id}/update-status")
@requires_auth(role="admin")
def update_referral_status(referral_id: int, status: str):
    update_status_in_db(referral_id, status)
    referring_employee = get_referring_employee(referral_id)
    send_notification_email(referring_employee, referral_id, status)
    create_portal_notification(referring_employee, referral_id, status)
    return {"message": "Referral status updated"}
