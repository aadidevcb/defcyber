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

@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_file(self, file_name: str) -> AddFileResult:
        hash_key = hashlib.sha256(file_name.encode()).hexdigest()
        created = FileHash.objects.get_or_create(file_name=file_name, hash_key=hash_key)
        return AddFileResult(success=created, file_name=file_name, hash_key=hash_key)

schema = strawberry.Schema(query=Query, mutation=Mutation)
