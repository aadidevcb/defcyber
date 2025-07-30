import strawberry
from .models import FileHash
import os
import json

@strawberry.type
class HashCheckResult:
    exists: bool

@strawberry.type
class AddFileResult:
    success: bool
    hash_key: str


@strawberry.type
class PortsOutput:
    open_ports: list[int]


@strawberry.type
class OutputData:
    count: int
    affected: bool

@strawberry.type
class Query:
    @strawberry.field
    def check_file_hash(self) -> HashCheckResult:
        hash_obj = FileHash.objects.first()
        try:
            with open("/usr/src/app/shared/legacy.txt", "r") as f:
                content = f.read().strip()
            exists = content == hash_obj.hash_key
        except Exception:
            exists = False
        return HashCheckResult(exists=exists)

    @strawberry.field
    def get_ports(self) -> PortsOutput:
        with open("/usr/src/app/shared/ports.json") as f:
            data = json.load(f)
        return PortsOutput(open_ports=data.get("open_ports", []))

    @strawberry.field
    def get_output(self) -> OutputData:
        with open("/usr/src/app/shared/output.json") as f:
            data = json.load(f)
        return OutputData(count=data.get("count", 0), affected=data.get("affected", False))
    @strawberry.field
    def hello(self) -> str:
        return "world"

schema = strawberry.Schema(query=Query)
