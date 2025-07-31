import strawberry
from .models import FileHash
import os
import json

@strawberry.type
class HashCheckResult:
    exists: bool
@strawberry.type
class NetworkType:
    down:int
    up:int

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
                content = f.read().strip().split(' ')[0]
            exists = content == hash_obj.hash_key
        except Exception:
            exists = False
        print(f"{hash_obj} {content} {exists}")
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
    def lockdown(self) -> bool:
        result = os.system('python manager.py shutdown')
        return result == 0
    
    @strawberry.field
    def network_check(self) -> bool:
        result = os.system('python manager.py network_check')
        return result == 0

    @strawberry.field
    def release_lockdown(self) -> bool:
        result = os.system('python manager.py reset')
        return result == 0
    
    @strawberry.field
    def network_info(self) -> NetworkType:
        with open("/usr/src/app/shared/network.json") as f:
            data = json.load(f)
        return NetworkType(down=data.get("down", 0), up=data.get("up", 0))
    
    @strawberry.field
    def open_ports(self) -> bool:
        result = os.system('python manager.py ports_open')
        return result == 0


schema = strawberry.Schema(query=Query)
