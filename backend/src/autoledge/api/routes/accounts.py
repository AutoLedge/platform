"""Bank accounts of one business.

GET /businesses/{business_id}/accounts   member: every account, including
                                         ones whose connection was removed
"""

from sqlalchemy import select

from autoledge.api.deps import CurrentBusiness, DbSession
from autoledge.api.routers import business_router
from autoledge.api.routes.plaid import account_response
from autoledge.models import FinancialAccount
from autoledge.schemas.plaid import AccountResponse

router = business_router(tags=["accounts"])


@router.get("/accounts")
def list_accounts(ctx: CurrentBusiness, db: DbSession) -> list[AccountResponse]:
    """Connected accounts first, then by name."""
    accounts = db.scalars(
        select(FinancialAccount)
        .where(FinancialAccount.business_id == ctx.business.id)
        .order_by(
            FinancialAccount.plaid_item_id.is_(None),  # false (connected) first
            FinancialAccount.name,
            FinancialAccount.id,
        )
    ).all()
    return [account_response(account) for account in accounts]
