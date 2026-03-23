from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from . import crud, schemas

router = APIRouter(prefix="/calendar")


# Event Type Endpoints
@router.post("/event-types", response_model=schemas.EventTypeResponse, status_code=201)
def create_event_type(
    event_type: schemas.EventTypeCreate,
    db: Session = Depends(get_db)
):
    """Create a new event type"""
    return crud.create_event_type(db, event_type)


@router.get("/event-types", response_model=List[schemas.EventTypeResponse])
def get_event_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all event types"""
    return crud.get_event_types(db, skip=skip, limit=limit)


@router.get("/event-types/{event_type_id}", response_model=schemas.EventTypeResponse)
def get_event_type(
    event_type_id: int,
    db: Session = Depends(get_db)
):
    """Get event type by ID"""
    event_type = crud.get_event_type(db, event_type_id)
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    return event_type


@router.put("/event-types/{event_type_id}", response_model=schemas.EventTypeResponse)
def update_event_type(
    event_type_id: int,
    event_type: schemas.EventTypeUpdate,
    db: Session = Depends(get_db)
):
    """Update an event type"""
    updated_event_type = crud.update_event_type(db, event_type_id, event_type)
    if not updated_event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    return updated_event_type


@router.delete("/event-types/{event_type_id}", status_code=204)
def delete_event_type(
    event_type_id: int,
    db: Session = Depends(get_db)
):
    """Delete an event type"""
    if not crud.delete_event_type(db, event_type_id):
        raise HTTPException(status_code=404, detail="Event type not found")
    return None


# Calendar Event Endpoints
@router.post("/events", response_model=schemas.CalendarEventResponse, status_code=201)
def create_event(
    event: schemas.CalendarEventCreate,
    db: Session = Depends(get_db)
):
    """Create a new calendar event"""
    return crud.create_event(db, event)


@router.get("/events", response_model=List[schemas.CalendarEventResponse])
def get_events(
    start_date: Optional[datetime] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events ending before this date"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    event_type_id: Optional[int] = Query(None, description="Filter by event type ID"),
    search: Optional[str] = Query(None, description="Search in title, description, location"),
    all_day: Optional[bool] = Query(None, description="Filter all-day events"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get calendar events with optional filtering"""
    return crud.get_events(
        db,
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        event_type_id=event_type_id,
        search=search,
        all_day=all_day,
        skip=skip,
        limit=limit
    )


@router.get("/events/{event_id}", response_model=schemas.CalendarEventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get event by ID"""
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/events/{event_id}", response_model=schemas.CalendarEventResponse)
def update_event(
    event_id: int,
    event: schemas.CalendarEventUpdate,
    db: Session = Depends(get_db)
):
    """Update a calendar event"""
    updated_event = crud.update_event(db, event_id, event)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event


@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    hard_delete: bool = Query(False, description="Permanently delete the event"),
    db: Session = Depends(get_db)
):
    """Delete a calendar event"""
    if not crud.delete_event(db, event_id, soft_delete=not hard_delete):
        raise HTTPException(status_code=404, detail="Event not found")
    return None


# Utility Endpoints
@router.get("/events/search/{query}", response_model=List[schemas.CalendarEventResponse])
def search_events(
    query: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search events by title, description, or location"""
    return crud.search_events(db, query, limit)
