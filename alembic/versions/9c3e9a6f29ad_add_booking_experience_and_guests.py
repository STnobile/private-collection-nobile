"""add booking experience type and guest contacts

Revision ID: 9c3e9a6f29ad
Revises: 63a20105f897
Create Date: 2025-02-14 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c3e9a6f29ad"
down_revision: Union[str, None] = "63a20105f897"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.add_column(
            sa.Column("experience_type", sa.String(), nullable=False, server_default="guided_tour")
        )
        batch_op.add_column(sa.Column("guest_contacts", sa.Text(), nullable=True))

    with op.batch_alter_table("bookings") as batch_op:
        batch_op.alter_column("experience_type", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.drop_column("guest_contacts")
        batch_op.drop_column("experience_type")
