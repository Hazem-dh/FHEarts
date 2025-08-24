#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# File paths (relative to Frontend folder)
DEPLOYMENT_FILE="../Smart contracts/deployments/sepolia/FHEarts.json"
ADDRESSES_FILE="src/contract/addresses.ts"
ABI_FILE="src/contract/ABI.ts"

echo -e "${YELLOW}🔄 Starting contract data copy process...${NC}"

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${RED}❌ Error: Deployment file not found at $DEPLOYMENT_FILE${NC}"
    exit 1
fi

# Create directories if they don't exist
mkdir -p "src/contract"

echo -e "${YELLOW}📄 Reading deployment file...${NC}"

# Extract address using jq (if available) or grep/sed
if command -v jq &> /dev/null; then
    # Use jq for clean JSON parsing
    ADDRESS=$(jq -r '.address' "$DEPLOYMENT_FILE")
    ABI=$(jq '.abi' "$DEPLOYMENT_FILE")
else
    # Fallback to grep/sed if jq is not available
    echo -e "${YELLOW}⚠️  jq not found, using fallback method...${NC}"
    ADDRESS=$(grep -o '"address"[[:space:]]*:[[:space:]]*"[^"]*"' "$DEPLOYMENT_FILE" | sed 's/.*"address"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    # For ABI, we'll extract the entire abi array
    ABI=$(sed -n '/"abi"[[:space:]]*:/,/^[[:space:]]*]/p' "$DEPLOYMENT_FILE" | sed '1s/.*"abi"[[:space:]]*:[[:space:]]*//' | sed '$s/[[:space:]]*,[[:space:]]*$//')
fi

# Validate address
if [ -z "$ADDRESS" ] || [ "$ADDRESS" = "null" ]; then
    echo -e "${RED}❌ Error: Could not extract valid address from deployment file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract address found: $ADDRESS${NC}"

# Create addresses.ts file
echo -e "${YELLOW}📝 Creating addresses.ts file...${NC}"
cat > "$ADDRESSES_FILE" << EOF
// Auto-generated contract addresses
// This file is automatically updated by the deployment script

export const contract_address = "$ADDRESS" ;

EOF

echo -e "${GREEN}✅ addresses.ts created successfully${NC}"

# Create ABI.ts file
echo -e "${YELLOW}📝 Creating ABI.ts file...${NC}"
if command -v jq &> /dev/null; then
    # Use jq for properly formatted output
    echo "// Auto-generated contract ABI" > "$ABI_FILE"
    echo "// This file is automatically updated by the deployment script" >> "$ABI_FILE"
    echo "" >> "$ABI_FILE"
    echo "export const ABI = " >> "$ABI_FILE"
    echo "$ABI" >> "$ABI_FILE"
else
    # Fallback method
    cat > "$ABI_FILE" << EOF
// Auto-generated contract ABI
// This file is automatically updated by the deployment script

export const ABI = $ABI as const;
EOF
fi

echo -e "${GREEN}✅ ABI.ts created successfully${NC}"

# Verify files were created
if [ -f "$ADDRESSES_FILE" ] && [ -f "$ABI_FILE" ]; then
    echo -e "${GREEN}🎉 Contract data successfully copied!${NC}"
    echo -e "${GREEN}📍 Address file: $ADDRESSES_FILE${NC}"
    echo -e "${GREEN}📋 ABI file: $ABI_FILE${NC}"
    
    # Show file sizes
    ADDRESS_SIZE=$(wc -c < "$ADDRESSES_FILE")
    ABI_SIZE=$(wc -c < "$ABI_FILE")
    echo -e "${YELLOW}📊 File sizes: addresses.ts (${ADDRESS_SIZE} bytes), ABI.ts (${ABI_SIZE} bytes)${NC}"
else
    echo -e "${RED}❌ Error: Failed to create one or more files${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Process completed successfully!${NC}"