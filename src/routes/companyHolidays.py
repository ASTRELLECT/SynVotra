@router.post("/holidays/add")
@requires_auth(role="admin")
def add_holiday(holiday: HolidaySchema):
    save_holiday_to_db(holiday)
    return {"message": "Holiday added"}


@router.get("/holidays")
@requires_auth
def list_company_holidays():
    holidays = get_all_holidays()
    return {"holidays": holidays}

def is_date_holiday(date: datetime):
    return date in get_all_holiday_dates()

@router.post("/meetings/create")
def create_meeting_with_holiday_check(meeting_data: MeetingSchema):
    if is_date_holiday(meeting_data.date):
        return {"error": "Cannot schedule meeting on a company holiday"}, 400
    # Proceed with meeting creation logic...
