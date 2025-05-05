@router.post("/meetings/create")
@requires_auth(role=["employee", "manager", "admin"])
def create_meeting(request: Request, meeting_data: MeetingSchema):
    meeting_id = save_meeting_to_db(meeting_data)
    for participant in meeting_data.participants:
        send_invitation(participant, meeting_id)
    return {"message": "Meeting created", "meeting_id": meeting_id}


@router.post("/meetings/{meeting_id}/rsvp")
@requires_auth
def respond_to_invitation(meeting_id: int, response: RSVPResponseSchema, request: Request):
    user_id = request.user.id
    save_rsvp_response(meeting_id, user_id, response.status)
    return {"message": f"RSVP {response.status} recorded"}

def send_meeting_reminders():
    upcoming_meetings = get_meetings_within_next_hour()
    for meeting in upcoming_meetings:
        for participant in meeting.participants:
            send_reminder_email(participant, meeting)
