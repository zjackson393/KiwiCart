"""add breadcrumb_enabled to users

Revision ID: e8e725ecfb81
Revises: af77876fcbc6
Create Date: 2026-08-20 02:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e8e725ecfb81'
down_revision: Union[str, Sequence[str], None] = 'af77876fcbc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('breadcrumb_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column('users', 'breadcrumb_enabled')