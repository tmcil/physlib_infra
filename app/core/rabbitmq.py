import json
from uuid import UUID

import pika

from app.core.config import config, logger


def mq_publish_execution(execution_id: UUID) -> None:
    credentials = pika.PlainCredentials(
        config.mqusername,
        config.mqpassword,
    )

    parameters = pika.ConnectionParameters(
        host=config.mqhost,
        port=config.mqport,
        credentials=credentials,
        heartbeat=30,
        socket_timeout=5,
        blocked_connection_timeout=5,
        connection_attempts=10,
        retry_delay=3,
    )

    with pika.BlockingConnection(parameters) as connection:
        channel = connection.channel()

        # Ensure the queue exists and survives broker restarts
        channel.queue_declare(
            queue=config.mqqueue,
            durable=True,
        )

        # Wait for RabbitMQ to confirm published messages
        channel.confirm_delivery()

        message = json.dumps(
            {
                "execution_id": str(execution_id),
            }
        ).encode("utf-8")

        channel.basic_publish(
            exchange="",
            routing_key=config.mqqueue,
            body=message,
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=pika.DeliveryMode.Persistent,
            ),
        )

    logger.info(f"Published execution to queue: {execution_id!s}")
