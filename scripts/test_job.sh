#!/usr/bin/env bash
set -e

API="http://localhost:8000"

echo "=== Neuronix Lab — API Test ==="

echo ""
echo "1. Health check..."
curl -sf "$API/health" | python3 -m json.tool
echo ""

echo "2. Submitting test job (CNN / MNIST / 2 epochs)..."
RESPONSE=$(curl -sf -X POST "$API/jobs" \
  -H "Content-Type: application/json" \
  -d '{"model": "cnn", "dataset": "mnist", "epochs": 2, "learning_rate": 0.001}')
echo "$RESPONSE" | python3 -m json.tool

JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])")
echo ""
echo "3. Job queued with ID: $JOB_ID"

echo ""
echo "4. Listing all jobs..."
curl -sf "$API/jobs" | python3 -m json.tool | head -40
echo ""

echo "5. Fetching job detail for $JOB_ID..."
curl -sf "$API/jobs/$JOB_ID" | python3 -m json.tool
echo ""

echo "=== Test complete ==="
