"""Pydantic request/response models: the API's public shapes.

Routes return these, never SQLAlchemy models, so internal or sensitive columns
(e.g. Plaid access tokens) can't leak into a response by accident.
"""
