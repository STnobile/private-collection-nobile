"""add timestamps and rename deleted bookings columns

Revision ID: 63a20105f897
Revises: 483b053c1e21
Create Date: 2025-10-19 18:03:09.069312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '63a20105f897'
down_revision: Union[str, None] = '483b053c1e21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch:
        batch.add_column(
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
        )

    with op.batch_alter_table('bookings', schema=None) as batch:
        batch.add_column(
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
        )

    with op.batch_alter_table('deleted_bookings', schema=None) as batch:
        batch.alter_column('name', new_column_name='user_name')
        batch.alter_column('surname', new_column_name='user_surname')
        batch.alter_column('email', new_column_name='user_email')
        batch.alter_column('phone', new_column_name='user_phone')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('deleted_bookings', schema=None) as batch:
        batch.alter_column('user_name', new_column_name='name')
        batch.alter_column('user_surname', new_column_name='surname')
        batch.alter_column('user_email', new_column_name='email')
        batch.alter_column('user_phone', new_column_name='phone')

    with op.batch_alter_table('bookings', schema=None) as batch:
        batch.drop_column('created_at')

    with op.batch_alter_table('users', schema=None) as batch:
        batch.drop_column('created_at')
