#!/usr/bin/env python3
"""Give the seeded clinic accounts the demo PIN.

The identity service seeds the demo clinic's staff without a PIN, so the first
sign-in of each account asks the user to choose one. A local run sets the same
PIN for every one of them, so a demo never stops at the PIN setup screen.

The script signs each account in with the code the local run sends and sets
the PIN. An account that already has a PIN is left alone.
"""

import json
import os
import sys
import urllib.error
import urllib.request

API = os.environ.get("MEDMATE_API", "http://127.0.0.1:8080")
CODE = os.environ.get("MEDMATE_DEMO_CODE", "123456")
PIN = os.environ.get("MEDMATE_DEMO_PIN", "1234")

ACCOUNTS = [
    ("9845012345", "Dr. Ananya Rao", "owner"),
    ("9741022981", "Dr. Meghana Iyer", "doctor"),
    ("9986041277", "Dr. Vikram Shenoy", "doctor"),
    ("9880433120", "Kiran Bhat", "admin"),
    ("9886244120", "Mary Joseph", "nurse"),
    ("9900122331", "Priya Shetty", "front desk"),
    ("9876500011", "Reception desk", "front desk, no grants"),
]


def call(path, body, token=None):
    request = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    if token:
        request.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b"{}")


def main():
    failures = 0
    for phone, name, role in ACCOUNTS:
        status, sent = call(
            "/auth/otp/send", {"phone": phone, "accountType": "clinic", "purpose": "login"}
        )
        if status != 200:
            print(f"{phone} {name}: could not send a code ({status})")
            failures += 1
            continue
        if sent.get("mode") == "pin":
            print(f"{phone} {name}: already has a PIN")
            continue

        status, session = call(
            "/auth/otp/verify",
            {"phone": phone, "accountType": "clinic", "purpose": "login", "code": CODE},
        )
        if status != 200:
            print(f"{phone} {name}: the code was not accepted ({status})")
            failures += 1
            continue

        token = session.get("accessToken")
        status, _ = call("/auth/pin/set", {"pin": PIN}, token=token)
        if status != 200:
            print(f"{phone} {name}: could not set the PIN ({status})")
            failures += 1
            continue
        print(f"{phone} {name} ({role}): PIN {PIN} is set")

    if failures:
        print(f"\n{failures} account(s) could not be set up")
        return 1
    print(f"\nEvery demo account signs in with the code {CODE} and the PIN {PIN}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
