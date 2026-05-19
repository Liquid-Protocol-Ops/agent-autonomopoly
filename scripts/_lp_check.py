"""
Read-only on-chain LP monitor for AUTONOMOPOLY.
Uses Base mainnet RPC via urllib (no deps beyond stdlib).
"""
import json, urllib.request, struct, sys

RPC = "https://mainnet.base.org"
AGENT = "0x8767Df39eCeeaeB11554642237aC4E08660aB6A3"
NFPM  = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"
DIEM  = "0xF4d97F2da56e8c3098f3a8D538DB630A2606a024"
WETH  = "0x4200000000000000000000000000000000000006"
FEE_LOCKER = "0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF"
POOL  = "0x80d995189ecc593672aD4703b250a5e82672EB1D"

_id = 0
def rpc(method, params):
    global _id
    _id += 1
    body = json.dumps({"jsonrpc":"2.0","id":_id,"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        res = json.loads(r.read())
    if "error" in res:
        raise RuntimeError(res["error"])
    return res["result"]

def call(to, data):
    return rpc("eth_call", [{"to": to, "data": data}, "latest"])

def pad_addr(a):
    return a[2:].lower().zfill(64)

def u256(h):
    return int(h, 16) if h.startswith("0x") else int(h.lstrip("0") or "0", 16)

def fmt18(v):
    return v / 1e18

# ── ETH balance ────────────────────────────────────────────────────────
eth_hex = rpc("eth_getBalance", [AGENT, "latest"])
eth = fmt18(int(eth_hex, 16))
print(f"ETH:  {eth:.6f}")

# ── DIEM wallet balance ────────────────────────────────────────────────
diem_raw = call(DIEM, "0x70a08231" + pad_addr(AGENT))
diem = fmt18(u256(diem_raw))
print(f"DIEM: {diem:.4f}")

# ── FeeLocker ─────────────────────────────────────────────────────────
fee_raw = call(FEE_LOCKER, "0x9d7a72d5" + pad_addr(AGENT) + pad_addr(DIEM))
fee_claimable = fmt18(u256(fee_raw))
print(f"FeeLocker: {fee_claimable:.6f} DIEM claimable")

# ── Pool slot0 (currentTick) ───────────────────────────────────────────
slot0 = call(POOL, "0x3850c7bd")
raw = slot0[2:]
# slot0 returns multiple values packed; tick is the second 256-bit slot (words[1])
tick_hex = raw[64:128]
tick_val = int(tick_hex, 16)
if tick_val >= 2**23:
    tick_val -= 2**24
current_tick = tick_val
print(f"Pool currentTick: {current_tick}")

# ── NFPM: count of positions owned ────────────────────────────────────
nfpm_bal_raw = call(NFPM, "0x70a08231" + pad_addr(AGENT))
nfpm_bal = u256(nfpm_bal_raw)
print(f"NFPM positions owned: {nfpm_bal}")

# ── Per-position details ───────────────────────────────────────────────
# tokenOfOwnerByIndex(address,uint256) = 0x2f745c59
# positions(uint256) = 0x99fbab88
out_of_range = []
in_range = []

for i in range(nfpm_bal):
    idx_hex = hex(i)[2:].zfill(64)
    tok_raw = call(NFPM, "0x2f745c59" + pad_addr(AGENT) + idx_hex)
    token_id = u256(tok_raw)

    tid_hex = hex(token_id)[2:].zfill(64)
    pos_raw = call(NFPM, "0x99fbab88" + tid_hex)
    # positions returns 12 values × 32 bytes each
    pos_hex = pos_raw[2:]
    words = [pos_hex[i*64:(i+1)*64] for i in range(12)]

    # nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0, feeGrowthInside1, tokensOwed0, tokensOwed1
    token0 = "0x" + words[2][24:]
    token1 = "0x" + words[3][24:]
    fee = u256(words[4])

    # tickLower / tickUpper are signed int24 packed in 32-byte slot
    tl_raw = u256(words[5])
    if tl_raw >= 2**23: tl_raw -= 2**24
    tu_raw = u256(words[6])
    if tu_raw >= 2**23: tu_raw -= 2**24

    liquidity = u256(words[7])
    owed0 = u256(words[10])
    owed1 = u256(words[11])

    in_r = tl_raw < current_tick < tu_raw
    status = "IN_RANGE" if in_r else "OUT_OF_RANGE"
    if liquidity == 0:
        status = "BURNED"

    print(f"\n  tokenId {token_id}:")
    print(f"    token0={token0[:10]}... token1={token1[:10]}... fee={fee}")
    print(f"    range=[{tl_raw}, {tu_raw}]  currentTick={current_tick}  → {status}")
    print(f"    liquidity={liquidity}")
    print(f"    owed0={fmt18(owed0):.6f} WETH  owed1={fmt18(owed1):.6f} DIEM")

    if status == "OUT_OF_RANGE":
        out_of_range.append(token_id)
    elif status == "IN_RANGE":
        in_range.append(token_id)

print(f"\n=== SUMMARY ===")
print(f"In-range: {in_range}")
print(f"Out-of-range: {out_of_range}")
print(f"ETH gas: {eth:.6f}  FeeLocker: {fee_claimable:.6f} DIEM")
