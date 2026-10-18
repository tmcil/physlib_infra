import json
from collections.abc import Awaitable, Callable
from typing import Any
from uuid import UUID

import aio_pika
from aio_pika import DeliveryMode, ExchangeType, Message
from aio_pika.abc import AbstractIncomingMessage
from app.api.v1.websockets import manager
from app.core.config import config, logger


class RabbitMQClient:
    def __init__(self):
        self.connection = None
        self.publish_channel = None
        self.consumer_channel = None

        self.execution_queue = config.mqexecutionqueue
        self.log_queue = config.mqlogqueue
        self.result_queue = config.mqresultqueue

    async def connect(self):
        self.connection = await aio_pika.connect_robust(
            host=config.mqhost,
            port=config.mqport,
            login=config.mqusername,
            password=config.mqpassword,
            heartbeat=30,
            timeout=5,
        )

        self.publish_channel = await self.connection.channel(
            publisher_confirms=True,
        )
        self.consumer_channel = await self.connection.channel()

        for queue_name in (
            self.execution_queue,
            self.log_queue,
            self.result_queue,
        ):
            await self.publish_channel.declare_queue(
                queue_name,
                durable=True,
            )

        logger.info("Connected to RabbitMQ")

    async def publish_execution(self, execution_id: UUID):
        message = Message(
            body=json.dumps({"execution_id": str(execution_id)}).encode("utf-8"),
            content_type="application/json",
            delivery_mode=DeliveryMode.PERSISTENT,
        )

        if self.publish_channel is None:
            logger.error("Publish channel is not open")
            raise RuntimeError("Publish channel is not open")

        await self.publish_channel.default_exchange.publish(
            message,
            routing_key=self.execution_queue,
        )

        logger.info("Published execution to queue: %s", execution_id)

    async def consume(
        self,
        queue_name: str,
        handler,
    ):
        if self.consumer_channel is None:
            logger.error("Consumer channel is not open")
            raise RuntimeError("Consumer channel is not open")

        queue = await self.consumer_channel.declare_queue(
            queue_name,
            durable=True,
        )

        await queue.consume(self._make_callback(handler))

        logger.info("Consuming RabbitMQ queue: %s", queue_name)

    @staticmethod
    def _make_callback(
        handler: Callable[[dict[str, Any]], Awaitable[None]],
    ):
        async def callback(message: AbstractIncomingMessage) -> None:
            async with message.process():
                event = json.loads(message.body)
                await handler(event)

        return callback

    async def close(self):
        if self.connection is not None and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")


async def handle_log(event: dict):
    execution_id = UUID(event.get("execution_id", ""))
    await manager.send_to_execution(execution_id, event)


async def handle_result(event: dict):
    execution_id = UUID(event.get("execution_id", ""))
    await manager.send_to_execution(execution_id, event)
