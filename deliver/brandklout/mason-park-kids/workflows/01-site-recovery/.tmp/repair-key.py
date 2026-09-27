#!/usr/bin/env python3
"""Repair the truncated SiteGround private key in .env, given its passphrase.

WHY THIS EXISTS
---------------
`PRIVATEKEY` in the repo-root .env is 387 base64 characters. A complete
OpenSSH ed25519 key of this shape needs 388. Everything up to and including the
private-blob length field decodes correctly -- the embedded public key is a
byte-for-byte match for `PUBLICKEY` -- and the declared blob length is 160 bytes
while only 159 survive. So exactly one base64 character was lost somewhere in
the tail when the key was pasted into .env.

Because the first 130 bytes are provably intact, the loss cannot be earlier than
base64 index 176. That leaves 211 positions x 64 alphabet characters ~= 13.5k
candidates.

WHY IT IS FAST
--------------
The bcrypt KDF depends only on the passphrase, the 16-byte salt and the round
count -- all of which live in the intact prefix. So the AES-256-CTR key and IV
are derived ONCE, and each of the 13.5k candidates costs a single 160-byte
decrypt plus an integer comparison. The whole sweep runs in about a second.

The oracle is OpenSSH's own integrity check: the decrypted blob opens with two
identical 4-byte "checkints", then the key type, then a public key that must
equal the one we already hold. Three independent constraints -- a false positive
is not a realistic concern.

USAGE
-----
    pip install bcrypt cryptography
    python repair-key.py                 # prompts for the passphrase, never echoes it

On success it writes .secrets/sg_pediatric_repaired (mode 600) and prints the
one-line base64 to paste back over PRIVATEKEY in .env. It never prints the key
material itself and never writes the passphrase anywhere.
"""

import base64
import getpass
import os
import re
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *([".."] * 6)))
ENV = os.path.join(ROOT, ".env")
OUT_DIR = os.path.join(ROOT, ".secrets")
OUT = os.path.join(OUT_DIR, "sg_pediatric_repaired")

B64AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

try:
    import bcrypt
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
except ImportError:
    sys.exit("needs two packages:  pip install bcrypt cryptography")


def read_env(key):
    with open(ENV, encoding="utf-8") as fh:
        m = re.search(r"^%s=(.*)$" % key, fh.read(), re.M)
    return m.group(1).strip() if m else None


def ssh_string(buf, off):
    (n,) = struct.unpack(">I", buf[off:off + 4])
    return buf[off + 4:off + 4 + n], off + 4 + n


def parse_header(blob):
    """Pull cipher, KDF options and the public key out of the intact prefix."""
    assert blob[:15] == b"openssh-key-v1\x00", "not an OpenSSH v1 key"
    off = 15
    cipher, off = ssh_string(blob, off)
    kdfname, off = ssh_string(blob, off)
    kdfopts, off = ssh_string(blob, off)
    (nkeys,) = struct.unpack(">I", blob[off:off + 4])
    off += 4
    pub, off = ssh_string(blob, off)
    (privlen,) = struct.unpack(">I", blob[off:off + 4])
    priv_start = off + 4
    salt, o2 = ssh_string(kdfopts, 0)
    (rounds,) = struct.unpack(">I", kdfopts[o2:o2 + 4])
    return {
        "cipher": cipher.decode(),
        "kdfname": kdfname.decode(),
        "salt": salt,
        "rounds": rounds,
        "pub": pub,
        "privlen": privlen,
        "priv_start": priv_start,
    }


def main():
    raw = read_env("PRIVATEKEY")
    pub_line = read_env("PUBLICKEY")
    if not raw or not pub_line:
        sys.exit("PRIVATEKEY / PUBLICKEY not found in %s" % ENV)

    known_pub = base64.b64decode(pub_line.split()[1])
    blob = base64.b64decode(raw + "=" * ((4 - len(raw) % 4) % 4))
    hdr = parse_header(blob)

    if hdr["pub"] != known_pub:
        sys.exit("embedded public key does not match PUBLICKEY -- damage is earlier than assumed")
    have = len(blob) - hdr["priv_start"]
    missing = hdr["privlen"] - have
    print("cipher      : %s / %s, %d rounds" % (hdr["cipher"], hdr["kdfname"], hdr["rounds"]))
    print("private blob: declared %d bytes, present %d, short by %d" % (hdr["privlen"], have, missing))
    if missing <= 0:
        sys.exit("this key is not truncated -- nothing to repair")
    if hdr["cipher"] != "aes256-ctr" or hdr["kdfname"] != "bcrypt":
        sys.exit("unexpected cipher/kdf combination; this script only handles aes256-ctr + bcrypt")

    passphrase = getpass.getpass("SiteGround key passphrase (not echoed): ").encode()

    # Derived once: the KDF inputs all live in the intact prefix.
    material = bcrypt.kdf(
        password=passphrase,
        salt=hdr["salt"],
        desired_key_bytes=48,
        rounds=hdr["rounds"],
        ignore_few_rounds=True,
    )
    aes_key, iv = material[:32], material[32:48]

    def opens(ciphertext):
        """OpenSSH's own integrity check, used as the oracle."""
        if len(ciphertext) != hdr["privlen"]:
            return False
        dec = Cipher(algorithms.AES(aes_key), modes.CTR(iv)).decryptor()
        plain = dec.update(ciphertext) + dec.finalize()
        c1, c2 = struct.unpack(">II", plain[:8])
        if c1 != c2:
            return False
        try:
            keytype, off = ssh_string(plain, 8)
            pub, off = ssh_string(plain, off)
        except Exception:
            return False
        return keytype == b"ssh-ed25519" and pub == hdr["pub"]

    # Bytes 0..129 are provably intact, so the deletion is at base64 index >= 176.
    first = 176
    print("sweeping %d candidate positions x 64 characters ..." % (len(raw) - first))
    for pos in range(first, len(raw) + 1):
        for ch in B64AL:
            cand = raw[:pos] + ch + raw[pos:]
            try:
                cand_blob = base64.b64decode(cand + "=" * ((4 - len(cand) % 4) % 4))
            except Exception:
                continue
            ct = cand_blob[hdr["priv_start"]:hdr["priv_start"] + hdr["privlen"]]
            if opens(ct):
                print("\nRECOVERED: one '%s' was missing at base64 index %d" % (ch, pos))
                write_key(cand)
                return
    sys.exit(
        "\nNo candidate opened.\n"
        "Either the passphrase is wrong, or more than one character was lost.\n"
        "Generating a fresh key and installing it in SiteGround Site Tools is the\n"
        "faster fix at that point -- see README.md."
    )


def write_key(b64):
    import textwrap

    pem = (
        "-----BEGIN OPENSSH PRIVATE KEY-----\n"
        + "\n".join(textwrap.wrap(b64, 70))
        + "\n-----END OPENSSH PRIVATE KEY-----\n"
    )
    os.makedirs(OUT_DIR, exist_ok=True)
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", newline="\n") as fh:
        fh.write(pem)
    print("wrote %s (mode 600)" % OUT)
    print("\nPaste this back over PRIVATEKEY in .env (one line):\n")
    print(b64)
    print(
        "\nThen:  SG_KEY=%s bash 01-inventory.sh\n"
        "(the key is still passphrase-protected, so ssh will prompt)" % OUT
    )


if __name__ == "__main__":
    main()
