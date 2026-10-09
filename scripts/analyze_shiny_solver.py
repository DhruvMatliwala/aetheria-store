#!/usr/bin/env python3
"""
Shiny Seed & Algorithm Analysis Toolkit
Aetheria Store Research & Development

This script provides:
1. Mathematical hypothesis testing across standard gaming PRNG and hash families
   (TSV/PSV XOR bitmasks, 64-bit LCG, FNV-1a, Murmur3, xxHash).
2. Ground-truth dataset evaluation to test if encounter data satisfies candidate formulas.
3. Live scanner API inspector to query PokeXperience /shiny-check.php and dump raw payloads.
"""

import sys
import json
import struct
import argparse
import urllib.request
import urllib.error
from typing import List, Dict, Tuple, Optional

# ---------------------------------------------------------------------------
# 1. Standard Hashing Primitives (Pure Python Implementations)
# ---------------------------------------------------------------------------

def fnv1a_64(p_id: int, e_id: int, salt: int = 0) -> int:
    """64-bit Fowler-Noll-Vo hash."""
    FNV_OFFSET = 14695981039346656037
    FNV_PRIME = 1099511628211
    MASK64 = 0xFFFFFFFFFFFFFFFF

    h = (FNV_OFFSET ^ salt) & MASK64
    payload = struct.pack("<QQ", p_id & MASK64, e_id & MASK64)
    for byte in payload:
        h = ((h ^ byte) * FNV_PRIME) & MASK64
    return h


def murmurhash64a(p_id: int, e_id: int, seed: int = 0) -> int:
    """64-bit MurmurHash64A implementation."""
    m = 0xC6A4A7935BD1E995
    r = 47
    MASK64 = 0xFFFFFFFFFFFFFFFF

    h = (seed ^ (16 * m)) & MASK64
    payload = struct.pack("<QQ", p_id & MASK64, e_id & MASK64)

    for i in range(0, 16, 8):
        k = struct.unpack("<Q", payload[i:i+8])[0]
        k = (k * m) & MASK64
        k = (k ^ (k >> r)) & MASK64
        k = (k * m) & MASK64

        h = (h ^ k) & MASK64
        h = (h * m) & MASK64

    h = (h ^ (h >> r)) & MASK64
    h = (h * m) & MASK64
    h = (h ^ (h >> r)) & MASK64
    return h


def lcg_64(p_id: int, e_id: int, mult: int = 6364136223846793005, add: int = 1442695040888963407) -> int:
    """64-bit Linear Congruential Generator step."""
    MASK64 = 0xFFFFFFFFFFFFFFFF
    seed = (p_id ^ e_id) & MASK64
    return ((seed * mult) + add) & MASK64


def tsv_psv_xor(p_id: int, e_id: int, shift: int = 4) -> int:
    """Mainline Pokemon style XOR reduction."""
    p_high = (p_id >> 32) & 0xFFFFFFFF
    p_low = p_id & 0xFFFFFFFF
    tsv = (p_high ^ p_low) >> shift

    e_high = (e_id >> 32) & 0xFFFFFFFF
    e_low = e_id & 0xFFFFFFFF
    psv = (e_high ^ e_low) >> shift

    return tsv ^ psv


# ---------------------------------------------------------------------------
# 2. Hypothesis Testing Engine
# ---------------------------------------------------------------------------

class ShinyHypothesisTester:
    def __init__(self, dataset: List[Dict[str, int]]):
        """
        dataset is a list of dicts:
        [
            {"player_id": 0x1234, "encounter_id": 0x5678, "is_shiny": 1, "species_id": 25},
            ...
        ]
        """
        self.dataset = dataset
        self.shinies = [d for d in dataset if d.get("is_shiny") == 1]
        self.non_shinies = [d for d in dataset if d.get("is_shiny") == 0]

    def test_tsv_xor(self, rate_denominator: int = 512) -> bool:
        """Tests if (TSV ^ PSV) == 0 holds for all shinies and != 0 for non-shinies."""
        if not self.shinies:
            return False

        for shift in range(0, 16):
            valid = True
            for d in self.shinies:
                val = tsv_psv_xor(d["player_id"], d["encounter_id"], shift)
                if (val % rate_denominator) != 0:
                    valid = False
                    break
            if valid:
                false_positives = sum(
                    1 for d in self.non_shinies
                    if (tsv_psv_xor(d["player_id"], d["encounter_id"], shift) % rate_denominator) == 0
                )
                print(f"[FOUND CANDIDATE] TSV-XOR with shift={shift}: False Positives={false_positives}/{len(self.non_shinies)}")
                return True
        return False

    def test_murmur_seed_range(self, seed_max: int = 10000, rate_denominator: int = 512) -> Optional[int]:
        """Brute-forces common small seed salts for Murmur64."""
        if not self.shinies:
            return None

        print(f"Scanning Murmur64 seeds 0..{seed_max} against {len(self.shinies)} shiny samples...")
        for seed in range(seed_max):
            match = True
            for d in self.shinies:
                h = murmurhash64a(d["player_id"], d["encounter_id"], seed)
                if (h % rate_denominator) != 0:
                    match = False
                    break
            if match:
                false_positives = sum(
                    1 for d in self.non_shinies
                    if (murmurhash64a(d["player_id"], d["encounter_id"], seed) % rate_denominator) == 0
                )
                print(f"[FOUND CANDIDATE] Murmur64 with seed={seed}: False Positives={false_positives}/{len(self.non_shinies)}")
                return seed
        return None

    def test_fnv1a_salt_range(self, salt_max: int = 10000, rate_denominator: int = 512) -> Optional[int]:
        """Brute-forces common small salts for FNV-1a 64-bit."""
        if not self.shinies:
            return None

        print(f"Scanning FNV-1a salts 0..{salt_max} against {len(self.shinies)} shiny samples...")
        for salt in range(salt_max):
            match = True
            for d in self.shinies:
                h = fnv1a_64(d["player_id"], d["encounter_id"], salt)
                if (h % rate_denominator) != 0:
                    match = False
                    break
            if match:
                false_positives = sum(
                    1 for d in self.non_shinies
                    if (fnv1a_64(d["player_id"], d["encounter_id"], salt) % rate_denominator) == 0
                )
                print(f"[FOUND CANDIDATE] FNV-1a with salt={salt}: False Positives={false_positives}/{len(self.non_shinies)}")
                return salt
        return None


# ---------------------------------------------------------------------------
# 3. Live API Probe (Querying PokeXperience Endpoint)
# ---------------------------------------------------------------------------

def probe_pokexperience_api(friend_code: str, session_cookie: Optional[str] = None) -> Dict:
    """
    Directly queries pokexperience.com/shiny-check.php with a 12-digit friend code.
    Returns the parsed JSON response.
    """
    clean_code = "".join(filter(str.isdigit, friend_code))
    if len(clean_code) != 12:
        return {"error": "Friend code must be exactly 12 digits"}

    url = "https://pokexperience.com/shiny-check.php"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Referer": "https://pokexperience.com/shiny-check/"
    }
    if session_cookie:
        headers["Cookie"] = session_cookie

    payload = json.dumps({"code": clean_code, "confirm": False}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read().decode("utf-8")
            return json.loads(data)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return {"http_code": e.code, "error": body}
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# 4. Command Line Entrypoint
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Shiny Seed & Algorithm Analysis Toolkit")
    subparsers = parser.add_subparsers(dest="command")

    # Command: probe
    probe_parser = subparsers.add_parser("probe", help="Probe PokeXperience endpoint with a friend code")
    probe_parser.add_argument("--code", required=True, help="12-digit friend code (e.g. 123456789012)")
    probe_parser.add_argument("--cookie", required=False, help="Optional Discord session cookie")

    # Command: benchmark
    bench_parser = subparsers.add_parser("benchmark", help="Run synthetic validation benchmark on PRNG models")
    bench_parser.add_argument("--samples", type=int, default=1000, help="Number of synthetic encounters to generate")

    # Command: solve
    solve_parser = subparsers.add_parser("solve", help="Test candidate algorithms against a ground-truth JSON dataset")
    solve_parser.add_argument("--file", required=True, help="Path to JSON file containing list of encounter records")
    solve_parser.add_argument("--rate", type=int, default=512, help="Shiny rate denominator (e.g. 512, 64, 25)")

    args = parser.parse_args()

    if args.command == "probe":
        print(f"Probing scanner endpoint for Friend Code: {args.code}")
        res = probe_pokexperience_api(args.code, args.cookie)
        print("Raw API Response:")
        print(json.dumps(res, indent=2))

    elif args.command == "benchmark":
        print(f"Generating {args.samples} synthetic encounters to verify statistical distribution...")
        test_player = 0x4A1B2C3D4E5F6789
        shiny_hits_murmur = 0
        shiny_hits_fnv = 0
        shiny_hits_lcg = 0

        for i in range(args.samples):
            e_id = 0x1000000000000000 + (i * 0x7FFFFFFF)
            if (murmurhash64a(test_player, e_id, seed=42) % 512) == 0:
                shiny_hits_murmur += 1
            if (fnv1a_64(test_player, e_id, salt=42) % 512) == 0:
                shiny_hits_fnv += 1
            if (lcg_64(test_player, e_id) % 512) == 0:
                shiny_hits_lcg += 1

        print(f"Murmur64 Shinies: {shiny_hits_murmur}/{args.samples} (Expected ~ {args.samples // 512})")
        print(f"FNV-1a Shinies:   {shiny_hits_fnv}/{args.samples} (Expected ~ {args.samples // 512})")
        print(f"LCG Shinies:      {shiny_hits_lcg}/{args.samples} (Expected ~ {args.samples // 512})")

    elif args.command == "solve":
        with open(args.file, "r") as f:
            data = json.load(f)
        print(f"Loaded {len(data)} encounter records from {args.file}")
        tester = ShinyHypothesisTester(data)
        print("Testing TSV XOR model...")
        tester.test_tsv_xor(args.rate)
        print("Testing Murmur64 model...")
        tester.test_murmur_seed_range(seed_max=10000, rate_denominator=args.rate)
        print("Testing FNV-1a model...")
        tester.test_fnv1a_salt_range(salt_max=10000, rate_denominator=args.rate)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
