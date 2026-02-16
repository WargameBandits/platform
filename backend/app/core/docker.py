"""Docker 클라이언트 싱글턴 모듈.

Docker SDK는 async를 지원하지 않으므로 동기 클라이언트를 글로벌 싱글턴으로 관리한다.
"""

import docker

_docker_client: docker.DockerClient | None = None


def get_docker_client() -> docker.DockerClient:
    """Docker 클라이언트 싱글턴을 반환한다.

    Returns:
        DockerClient 인스턴스.
    """
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()
    return _docker_client
