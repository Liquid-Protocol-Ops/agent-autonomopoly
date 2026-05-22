#!/usr/bin/env bash
set -e

AGENT="0x8767Df39eCeeaeB11554642237aC4E08660aB6A3"
NFPM="0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"
DIEM="0xF4d97F2da56e8c3098f3a8D538DB630A2606a024"
FEE_LOCKER="0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF"
POOL="0x80d995189ecc593672aD4703b250a5e82672EB1D"
WETH="0x4200000000000000000000000000000000000006"
RPC="https://mainnet.base.org"

PADDED_AGENT="000000000000000000000000${AGENT:2}"
PADDED_DIEM="000000000000000000000000${DIEM:2}"

rpc_call() {
  local to="$1" data="$2" id="$3"
  curl -sf "$RPC" -X POST -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$to\",\"data\":\"$data\"},\"latest\"],\"id\":$id}"
}

echo "=== Portfolio check 2026-05-22 ==="
echo "Agent: $AGENT"
echo ""

# ETH balance
ETH_RAW=$(curl -sf "$RPC" -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$AGENT\",\"latest\"],\"id\":1}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
echo "ETH:  $(python3 -c "print(f'{int(\"$ETH_RAW\",16)/1e18:.6f}')")"

# WETH
WETH_RAW=$(rpc_call "$WETH" "0x70a08231${PADDED_AGENT}" 2 | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
echo "WETH: $(python3 -c "print(f'{int(\"$WETH_RAW\",16)/1e18:.6f}')")"

# DIEM
DIEM_RAW=$(rpc_call "$DIEM" "0x70a08231${PADDED_AGENT}" 3 | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
echo "DIEM: $(python3 -c "print(f'{int(\"$DIEM_RAW\",16)/1e18:.4f}')")"

# FeeLocker claimable DIEM
# availableFees(address,address) selector = 0x0ab5cb16
CLAIM_RAW=$(rpc_call "$FEE_LOCKER" "0x0ab5cb16${PADDED_AGENT}${PADDED_DIEM}" 4 | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('result','0x0'))")
echo "FeeLocker claimable DIEM: $(python3 -c "print(f'{int(\"$CLAIM_RAW\",16)/1e18:.4f}')")"

echo ""
echo "=== Pool slot0 ==="
SLOT0=$(rpc_call "$POOL" "0x3850c7bd" 5 | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
python3 - "$SLOT0" <<'PYEOF'
import sys
result = sys.argv[1]
raw = bytes.fromhex(result[2:])
sqrtPrice = int.from_bytes(raw[0:32], 'big')
tick_raw = int.from_bytes(raw[32:64], 'big')
tick = tick_raw if tick_raw < 2**23 else tick_raw - 2**24
print(f"current tick: {tick}")
if sqrtPrice > 0:
    price = (sqrtPrice / (2**96))**2
    print(f"price (DIEM per WETH): {price:.8f}")
PYEOF

echo ""
echo "=== NFPM LP positions ==="
NFPM_BAL=$(rpc_call "$NFPM" "0x70a08231${PADDED_AGENT}" 6 | python3 -c "import sys,json; print(int(json.load(sys.stdin)['result'],16))")
echo "Positions owned: $NFPM_BAL"

# Read each tokenId
for i in $(seq 0 $((NFPM_BAL - 1))); do
  # tokenOfOwnerByIndex(address,uint256) = 0x2f745c59
  IDX_HEX=$(python3 -c "print(hex($i)[2:].zfill(64))")
  TOKEN_ID_RAW=$(rpc_call "$NFPM" "0x2f745c59${PADDED_AGENT}${IDX_HEX}" $((10+i)) | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
  TOKEN_ID=$(python3 -c "print(int(\"$TOKEN_ID_RAW\",16))")
  echo ""
  echo "  tokenId: $TOKEN_ID"

  # positions(uint256) = 0x99fbab88
  TOKEN_HEX=$(python3 -c "print(hex($TOKEN_ID)[2:].zfill(64))")
  POS_RAW=$(rpc_call "$NFPM" "0x99fbab88${TOKEN_HEX}" $((20+i)) | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
  python3 - "$POS_RAW" "$TOKEN_ID" <<'PYEOF2'
import sys
result = sys.argv[1]
token_id = sys.argv[2]
raw = bytes.fromhex(result[2:])
# positions() output (12 fields, each 32 bytes):
# nonce(96), operator(160), token0(160), token1(160), fee(24),
# tickLower(24), tickUpper(24), liquidity(128), feeGrowth0(256), feeGrowth1(256),
# tokensOwed0(128), tokensOwed1(128)
def word(n): return int.from_bytes(raw[n*32:(n+1)*32], 'big')
def sword(n, bits=24):
    v = word(n) & ((1 << bits) - 1)
    return v if v < (1 << (bits-1)) else v - (1 << bits)

nonce      = word(0)
operator   = word(1) & ((1<<160)-1)
token0     = word(2) & ((1<<160)-1)
token1     = word(3) & ((1<<160)-1)
fee        = word(4) & 0xFFFFFF
# tickLower/tickUpper are int24 stored right-aligned in slot 5 and 6
tickLower_raw = word(5) & 0xFFFFFF
tickUpper_raw = word(6) & 0xFFFFFF
tickLower = tickLower_raw if tickLower_raw < 2**23 else tickLower_raw - 2**24
tickUpper = tickUpper_raw if tickUpper_raw < 2**23 else tickUpper_raw - 2**24
liquidity  = word(7) & ((1<<128)-1)
owed0      = word(10) & ((1<<128)-1)
owed1      = word(11) & ((1<<128)-1)

t0 = hex(token0)
t1 = hex(token1)
print(f"    token0:    {t0}")
print(f"    token1:    {t1}")
print(f"    fee:       {fee} ({fee/10000}%)")
print(f"    tickLower: {tickLower}")
print(f"    tickUpper: {tickUpper}")
print(f"    liquidity: {liquidity}")
print(f"    owed0:     {owed0/1e18:.6f}")
print(f"    owed1:     {owed1/1e18:.4f}")
PYEOF2
done

echo ""
echo "=== Done ==="
