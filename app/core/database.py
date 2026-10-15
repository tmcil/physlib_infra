from sqlmodel import create_engine

from .config import config, logger

engine = create_engine(config.pgurl, echo=True)
logger.info(f"Connected to postgres via URL: {config.pgurl}")
