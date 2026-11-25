"""Routes for managing cloud instances"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..schemas import InstanceCreate, InstanceUpdate, InstanceResponse
from ..models import Instance, User
from ..utils.security import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/instances", response_model=List[InstanceResponse])
async def list_instances(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all cloud instances for the authenticated user.
    New users with no uploaded data will receive an empty list.
    """
    if not current_user:
        return []
    instances = db.query(Instance).filter(Instance.user_id == current_user.id).all()
    return instances


@router.post("/instances", response_model=InstanceResponse)
async def create_instance(
    instance: InstanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new cloud instance for current user
    """
    existing = db.query(Instance).filter(
        Instance.name == instance.name,
        Instance.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Instance with name '{instance.name}' already exists"
        )
    
    try:
        instance_dict = instance.dict()
        instance_dict["user_id"] = current_user.id
        db_instance = Instance(**instance_dict)
        db.add(db_instance)
        db.commit()
        db.refresh(db_instance)
        logger.info(f"Created instance: {instance.name} for user {current_user.username}")
        return db_instance
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating instance: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating instance")


@router.get("/instances/{instance_id}", response_model=InstanceResponse)
async def get_instance(
    instance_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific instance for current user
    """
    query = db.query(Instance).filter(Instance.id == instance_id)
    if current_user:
        query = query.filter(Instance.user_id == current_user.id)
    instance = query.first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    return instance


@router.put("/instances/{instance_id}", response_model=InstanceResponse)
async def update_instance(
    instance_id: int,
    instance_data: InstanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an instance's metrics
    """
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Update only provided fields
    update_data = instance_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(instance, key, value)
    
    try:
        db.commit()
        db.refresh(instance)
        logger.info(f"Updated instance: {instance.name}")
        return instance
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating instance: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating instance")


@router.delete("/instances/{instance_id}")
async def delete_instance(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an instance belonging to the current user
    """
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    try:
        instance_name = instance.name
        db.delete(instance)
        db.commit()
        logger.info(f"Deleted instance: {instance_name}")
        return {"message": f"Instance '{instance_name}' deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting instance: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting instance")
