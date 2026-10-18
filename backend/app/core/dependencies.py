from fastapi import Request

from app.core.rabbitmq import RabbitMQClient


def get_rabbitmq_client(request: Request) -> RabbitMQClient:
    return request.app.state.mqclient
