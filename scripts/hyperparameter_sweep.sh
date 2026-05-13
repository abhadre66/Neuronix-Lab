#!/usr/bin/env bash
set -e

API="http://localhost:8000"

echo "=== Neuronix Lab — Hyperparameter Sweep (8 runs) ==="
echo ""

declare -a MODELS=("mlp" "cnn" "mlp" "cnn" "mlp" "cnn" "mlp" "cnn")
declare -a DATASETS=("mnist" "mnist" "cifar10" "cifar10" "mnist" "mnist" "cifar10" "cifar10")
declare -a LRS=("0.01" "0.01" "0.01" "0.01" "0.001" "0.001" "0.001" "0.001")
EPOCHS=3

for i in {0..7}; do
  MODEL=${MODELS[$i]}
  DATASET=${DATASETS[$i]}
  LR=${LRS[$i]}

  echo "Run $((i+1))/8 — model=$MODEL dataset=$DATASET lr=$LR epochs=$EPOCHS"
  RESPONSE=$(curl -sf -X POST "$API/jobs" \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"$MODEL\", \"dataset\": \"$DATASET\", \"epochs\": $EPOCHS, \"learning_rate\": $LR}")
  JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])")
  echo "  → queued as $JOB_ID"
done

echo ""
echo "=== All 8 runs queued. Check MLflow at http://localhost:5001 ==="
