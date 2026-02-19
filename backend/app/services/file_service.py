"""챌린지 파일 업로드/다운로드 서비스.

파일 저장, 검증, 삭제를 처리한다.
"""

import asyncio
import hashlib
import logging
import shutil
from pathlib import Path

from fastapi import UploadFile

from app.core.exceptions import BadRequestException

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("/var/www/challenge-files")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


REPO_BACKEND_DIR = Path(__file__).resolve().parents[2]
CHALLENGES_ROOT_DIR = REPO_BACKEND_DIR / "challenges"

ALLOWED_EXTENSIONS = {
    ".c", ".cpp", ".h", ".py", ".js", ".ts", ".go", ".rs", ".java",
    ".rb", ".php", ".sh", ".pl", ".asm", ".s",
    ".txt", ".md", ".yaml", ".yml", ".json", ".xml", ".csv",
    ".html", ".css",
    ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z",
    ".so", ".dll", ".dylib",
    ".elf", ".exe", ".out",
    ".pcap", ".pcapng",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp",
    ".pdf", ".doc",
    ".db", ".sqlite",
    "",  # 확장자 없는 바이너리 (e.g., 'basic_bof')
}


def _ensure_challenge_dir(challenge_id: int) -> Path:
    """챌린지별 파일 디렉토리를 생성한다.

    Args:
        challenge_id: 챌린지 ID.

    Returns:
        디렉토리 Path.
    """
    dir_path = UPLOAD_DIR / str(challenge_id)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def _validate_extension(filename: str) -> None:
    """파일 확장자를 검증한다.

    Args:
        filename: 파일명.

    Raises:
        BadRequestException: 허용되지 않은 확장자일 때.
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestException(
            f"허용되지 않은 파일 확장자입니다: {ext}"
        )


async def upload_file(
    challenge_id: int,
    file: UploadFile,
) -> dict:
    """챌린지 파일을 업로드한다.

    Args:
        challenge_id: 챌린지 ID.
        file: 업로드된 파일.

    Returns:
        파일 정보 딕셔너리 (filename, size, sha256).

    Raises:
        BadRequestException: 파일이 유효하지 않을 때.
    """
    if not file.filename:
        raise BadRequestException("파일명이 없습니다.")

    # 경로 조작 방지
    safe_name = Path(file.filename).name
    if not safe_name or safe_name.startswith("."):
        raise BadRequestException("유효하지 않은 파일명입니다.")

    _validate_extension(safe_name)

    dir_path = _ensure_challenge_dir(challenge_id)
    file_path = dir_path / safe_name

    # 파일 크기 검증 및 저장
    sha256 = hashlib.sha256()
    total_size = 0

    with open(file_path, "wb") as f:
        while chunk := await file.read(8192):
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                f.close()
                file_path.unlink(missing_ok=True)
                raise BadRequestException(
                    f"파일 크기가 {MAX_FILE_SIZE // (1024 * 1024)}MB를 초과합니다."
                )
            sha256.update(chunk)
            f.write(chunk)

    logger.info(
        "파일 업로드: challenge=%d, file=%s, size=%d",
        challenge_id, safe_name, total_size,
    )

    return {
        "filename": safe_name,
        "size": total_size,
        "sha256": sha256.hexdigest(),
    }


async def upload_multiple_files(
    challenge_id: int,
    files: list[UploadFile],
) -> list[dict]:
    """여러 파일을 한 번에 업로드한다.

    Args:
        challenge_id: 챌린지 ID.
        files: 업로드 파일 리스트.

    Returns:
        파일 정보 리스트.
    """
    results = []
    for file in files:
        info = await upload_file(challenge_id, file)
        results.append(info)
    return results


async def list_files(challenge_id: int) -> list[str]:
    """챌린지에 업로드된 파일 목록을 반환한다.

    Args:
        challenge_id: 챌린지 ID.

    Returns:
        파일명 리스트.
    """
    def _list() -> list[str]:
        dir_path = UPLOAD_DIR / str(challenge_id)
        if not dir_path.exists():
            return []
        return [f.name for f in dir_path.iterdir() if f.is_file()]

    return await asyncio.to_thread(_list)


async def delete_file(challenge_id: int, filename: str) -> None:
    """챌린지 파일을 삭제한다.

    Args:
        challenge_id: 챌린지 ID.
        filename: 삭제할 파일명.

    Raises:
        BadRequestException: 파일이 없을 때.
    """
    safe_name = Path(filename).name
    file_path = UPLOAD_DIR / str(challenge_id) / safe_name
    if not file_path.exists():
        raise BadRequestException("파일을 찾을 수 없습니다.")
    await asyncio.to_thread(file_path.unlink)
    logger.info("파일 삭제: challenge=%d, file=%s", challenge_id, safe_name)


async def delete_challenge_files(challenge_id: int) -> None:
    """챌린지의 모든 파일을 삭제한다.

    Args:
        challenge_id: 챌린지 ID.
    """
    dir_path = UPLOAD_DIR / str(challenge_id)
    if dir_path.exists():
        await asyncio.to_thread(shutil.rmtree, dir_path)
        logger.info("챌린지 파일 전체 삭제: challenge=%d", challenge_id)


async def stage_release_files(
    challenge_id: int,
    source_dir: str,
    file_list: list[str],
) -> list[str]:
    """챌린지 소스 디렉토리에서 배포 대상 파일만 공개 디렉토리로 복사한다.

    source_dir는 backend/challenges 기준 상대 경로(예: pwn/example_bof)여야 한다.
    """
    if not file_list:
        return []

    normalized_source = Path(source_dir.strip().strip("/"))
    if not normalized_source.parts or ".." in normalized_source.parts:
        raise BadRequestException("유효하지 않은 소스 경로입니다.")

    source_root = (CHALLENGES_ROOT_DIR / normalized_source).resolve()
    if not source_root.is_dir() or CHALLENGES_ROOT_DIR.resolve() not in source_root.parents:
        raise BadRequestException("챌린지 소스 디렉토리를 찾을 수 없습니다.")

    dst_dir = _ensure_challenge_dir(challenge_id)
    copied: list[str] = []

    for filename in file_list:
        safe_name = Path(filename).name
        if safe_name != filename or not safe_name:
            raise BadRequestException(f"유효하지 않은 파일명입니다: {filename}")

        _validate_extension(safe_name)
        candidates = [
            source_root / "src" / safe_name,
            source_root / "files" / safe_name,
        ]
        src_path = next((candidate for candidate in candidates if candidate.is_file()), None)
        if src_path is None:
            logger.warning(
                "배포 파일을 찾지 못함: challenge=%d source=%s file=%s",
                challenge_id,
                source_root,
                safe_name,
            )
            continue

        await asyncio.to_thread(shutil.copy2, src_path, dst_dir / safe_name)
        copied.append(safe_name)

    return copied
