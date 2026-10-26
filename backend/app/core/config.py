import logging
import os
from datetime import UTC, datetime

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class ISO8601Formatter(logging.Formatter):
    def formatTime(self, record, datefmt=None):
        return datetime.fromtimestamp(record.created, tz=UTC).strftime(
            "%Y-%m-%dT%H:%M:%S"
        )


logging.basicConfig(level=logging.INFO)
logging.getLogger("pika").setLevel(logging.WARNING)

# Apply the same format to Uvicorn's loggers
for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
    logger = logging.getLogger(name)
    logger.handlers.clear()
    logger.propagate = True

handler = logging.StreamHandler()
handler.setFormatter(ISO8601Formatter("%(asctime)s %(levelname)s (BKE) %(message)s"))
root = logging.getLogger()
root.handlers.clear()
root.addHandler(handler)
root.setLevel(logging.INFO)


class Config(BaseSettings):
    app_name: str = "Physlib Backend"

    # PostgreSQL
    pghost: str = os.getenv("PGHOST", "")
    pgport: str = os.getenv("PGPORT", "")
    pgdatabase: str = os.getenv("PGDATABASE", "")
    pguser: str = os.getenv("PGUSER", "")
    pgpassword: str = os.getenv("PGPASSWORD", "")

    # RabbitMQ
    mqhost: str = os.getenv("RABBITMQ_HOST", "")
    mqusername: str = os.getenv("RABBITMQ_USERNAME", "")
    mqpassword: str = os.getenv("RABBITMQ_PASSWORD", "")
    mqexecutionqueue: str = os.getenv("RABBITMQ_EXECUTION_QUEUE", "")
    mqresultqueue: str = os.getenv("RABBITMQ_RESULT_QUEUE", "")
    mqlogqueue: str = os.getenv("RABBITMQ_LOG_QUEUE", "")
    mqport: int = int(os.getenv("RABBITMQ_PORT", "0"))

    # JWT auth
    jwt_auth_secret: str = os.getenv("JWT_AUTH_SECRET", "")

    # Persistent volume
    working_dir: str = os.getenv("WORKING_DIR", "")

    @property
    def pgurl(self) -> str:
        return f"postgresql://{self.pguser}:{self.pgpassword}@{self.pghost}:{self.pgport}/{self.pgdatabase}"


config = Config()
logger = logging.getLogger(__name__)
