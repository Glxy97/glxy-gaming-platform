from fastapi import APIRouter

from . import ai, datapad, forms

router = APIRouter()
router.include_router(forms.router)
router.include_router(datapad.router)
router.include_router(ai.router)