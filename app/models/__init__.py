# Models module — import all models here so Alembic can discover them
from app.models.analytics_aggregate import AnalyticsAggregate  # noqa: F401
from app.models.click import Click  # noqa: F401
from app.models.collection import Collection, CollectionItem  # noqa: F401
from app.models.health import URLHealth  # noqa: F401
from app.models.metadata import URLMetadata  # noqa: F401
from app.models.summary import URLSummary  # noqa: F401
from app.models.url import URL  # noqa: F401
from app.models.user import User  # noqa: F401
