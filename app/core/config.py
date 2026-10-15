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

handler = logging.StreamHandler()
handler.setFormatter(ISO8601Formatter("%(asctime)s %(levelname)s (SYS) %(message)s"))
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

    @property
    def pgurl(self) -> str:
        return f"postgresql://{self.pguser}:{self.pgpassword}@{self.pghost}:{self.pgport}/{self.pgdatabase}"


config = Config()
logger = logging.getLogger(__name__)
