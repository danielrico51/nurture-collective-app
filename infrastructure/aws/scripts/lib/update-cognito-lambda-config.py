#!/usr/bin/env python3
"""Update Cognito LambdaConfig via boto3 (supports InboundFederation on older AWS CLI)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def run_merge_script(pool_id: str, region: str, updates: list[str]) -> str:
    root = Path(__file__).resolve().parents[4]
    merge_sh = root / "infrastructure/aws/scripts/lib/merge-cognito-lambda-config.sh"
    cmd = ["bash", "-c", f'source "{merge_sh}" && merge_cognito_lambda_config "$@"', "_", pool_id, region, *updates]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout.strip()


def parse_lambda_config(shorthand: str) -> dict:
    config: dict = {}
    if not shorthand:
        return config

    parts: list[str] = []
    current = []
    depth = 0
    for char in shorthand:
        if char == "{":
            depth += 1
        elif char == "}":
            depth = max(depth - 1, 0)
        if char == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
            continue
        current.append(char)
    tail = "".join(current).strip()
    if tail:
        parts.append(tail)

    for part in parts:
        if part.startswith("PreSignUp="):
            config["PreSignUp"] = part.split("=", 1)[1]
        elif part.startswith("InboundFederation="):
            value = part.split("=", 1)[1]
            if value.startswith("{"):
                inner = value.strip("{}")
                fields = dict(item.split("=", 1) for item in inner.split(",") if "=" in item)
                config["InboundFederation"] = {
                    "LambdaVersion": fields.get("LambdaVersion", "V1_0"),
                    "LambdaArn": fields["LambdaArn"],
                }
        elif part.startswith("CustomEmailSender="):
            value = part.split("=", 1)[1]
            inner = value.strip("{}")
            fields = dict(item.split("=", 1) for item in inner.split(",") if "=" in item)
            config["CustomEmailSender"] = {
                "LambdaVersion": fields.get("LambdaVersion", "V1_0"),
                "LambdaArn": fields["LambdaArn"],
            }
        elif part.startswith("KMSKeyID="):
            config["KMSKeyID"] = part.split("=", 1)[1]

    return config


def ensure_boto3():
    try:
        import boto3  # noqa: F401
        return
    except ImportError:
        venv_dir = Path("/tmp/nurture-aws-boto3-venv")
        if not venv_dir.exists():
            subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
            subprocess.run([str(venv_dir / "bin/pip"), "install", "-q", "boto3"], check=True)
        sys.path.insert(0, str(venv_dir / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pool-id", required=True)
    parser.add_argument("--region", default="us-east-1")
    parser.add_argument("--auto-verified-attributes", default="email")
    parser.add_argument("updates", nargs="*")
    args = parser.parse_args()

    try:
        ensure_boto3()
        import boto3
    except Exception as exc:
        print(f"Failed to load boto3: {exc}", file=sys.stderr)
        return 1

    shorthand = run_merge_script(args.pool_id, args.region, args.updates)
    lambda_config = parse_lambda_config(shorthand)
    client = boto3.client("cognito-idp", region_name=args.region)
    current = client.describe_user_pool(UserPoolId=args.pool_id)["UserPool"]
    current_lambda = dict(current.get("LambdaConfig") or {})
    # Merge so partial shorthand updates never drop triggers the AWS CLI cannot describe.
    current_lambda.update(lambda_config)
    lambda_config = current_lambda
    auto_verified = [item.strip() for item in args.auto_verified_attributes.split(",") if item.strip()]

    client.update_user_pool(
        UserPoolId=args.pool_id,
        LambdaConfig=lambda_config,
        AutoVerifiedAttributes=auto_verified or current.get("AutoVerifiedAttributes") or ["email"],
    )

    updated = client.describe_user_pool(UserPoolId=args.pool_id)["UserPool"]["LambdaConfig"]
    print(json.dumps(updated, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
