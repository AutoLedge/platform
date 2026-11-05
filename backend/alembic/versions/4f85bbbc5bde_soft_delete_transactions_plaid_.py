"""soft delete transactions, plaid environment, transaction business fk

Revision ID: 4f85bbbc5bde
Revises: 301ddc4eb324
Create Date: 2026-11-05 17:34:02.914305

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '4f85bbbc5bde'
down_revision: Union[str, Sequence[str], None] = '301ddc4eb324'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # A: soft delete
    op.add_column(
        "transactions",
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # B: required environment. Existing rows (if any) can only be Sandbox,
    # so back-fill them, then drop the default: new rows must say which.
    op.add_column(
        "plaid_items",
        sa.Column(
            "plaid_environment",
            sa.String(length=20),
            nullable=False,
            server_default="sandbox",
        ),
    )
    op.alter_column("plaid_items", "plaid_environment", server_default=None)
    op.create_check_constraint(
        op.f("plaid_items_plaid_environment_check"),
        "plaid_items",
        "plaid_environment in ('sandbox', 'production')",
    )

    # C: unique key first, then swap the transaction -> account FK
    op.create_unique_constraint(
        "financial_accounts_id_business_id_key",
        "financial_accounts",
        ["id", "business_id"],
    )
    op.drop_constraint(
        op.f("transactions_account_id_fkey"), "transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        "transactions_account_id_business_id_fkey",
        "transactions",
        "financial_accounts",
        ["account_id", "business_id"],
        ["id", "business_id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "transactions_account_id_business_id_fkey", "transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        op.f("transactions_account_id_fkey"),
        "transactions",
        "financial_accounts",
        ["account_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint(
        "financial_accounts_id_business_id_key", "financial_accounts", type_="unique"
    )
    op.drop_constraint(
        op.f("plaid_items_plaid_environment_check"), "plaid_items", type_="check"
    )
    op.drop_column("plaid_items", "plaid_environment")
    op.drop_column("transactions", "removed_at")
