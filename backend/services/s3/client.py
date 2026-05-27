import json
from typing import Any

import boto3
from botocore.exceptions import ClientError
from django.conf import settings


def get_s3_client():
    return boto3.client("s3", region_name=settings.AWS_REGION)


def put_json(bucket: str, key: str, payload: dict[str, Any]) -> str:
    if not bucket:
        raise ValueError(f"S3 bucket not configured for key {key}")
    body = json.dumps(payload, indent=2, default=str)
    get_s3_client().put_object(
        Bucket=bucket,
        Key=key,
        Body=body.encode("utf-8"),
        ContentType="application/json",
    )
    return key


def get_json(bucket: str, key: str) -> dict[str, Any] | None:
    if not bucket:
        return None
    try:
        response = get_s3_client().get_object(Bucket=bucket, Key=key)
        return json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "NoSuchKey":
            return None
        raise


def list_prefix(bucket: str, prefix: str) -> list[str]:
    if not bucket:
        return []
    client = get_s3_client()
    keys: list[str] = []
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for item in page.get("Contents", []):
            keys.append(item["Key"])
    return keys
