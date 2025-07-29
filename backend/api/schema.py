import strawberry
import hashlib
from .models import FileHash
import os


@strawberry.type
class HashCheckResult:
    exists: bool


@strawberry.type
class AddFileResult:
    success: bool
    file_name: str
    hash_key: str

@strawberry.type
class Query:
    @strawberry.field
    def check_file_hash(self, file_name: str) -> HashCheckResult:
        hash=FileHash.objects.get(all)
        if os.system('sha256sum /app/shared/legacy')==hash:
            return HashCheckResult(exists=True)
        else:
            return HashCheckResult(exists=False)


schema = strawberry.Schema(query=Query)
