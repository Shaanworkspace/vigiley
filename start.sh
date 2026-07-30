#!/bin/bash

echo "============================="
echo "  VigilEye — Starting All Services"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_port() {
    lsof -i :$1 -P -n 2>/dev/null | grep LISTEN > /dev/null
    return $?
}

# 1. Backend
echo -n "[1/5] Starting Backend (port 5001)... "
if check_port 5001; then
    echo -e "${GREEN}Already running${NC}"
else
    cd backend && node server.js > /tmp/backend.log 2>&1 &
    sleep 2
    if check_port 5001; then echo -e "${GREEN}OK${NC}"; else echo -e "${RED}FAILED${NC}"; fi
fi

# 2. ML API
echo -n "[2/5] Starting ML API (port 5002)... "
if check_port 5002; then
    echo -e "${GREEN}Already running${NC}"
else
    cd vigiley-ml && source venv/bin/activate && nohup python3 api.py > /tmp/ml-api.log 2>&1 &
    sleep 3
    if check_port 5002; then echo -e "${GREEN}OK${NC}"; else echo -e "${RED}FAILED${NC}"; fi
fi

# 3. Driver App
echo -n "[3/5] Starting Driver App (port 3000)... "
if check_port 3000; then
    echo -e "${GREEN}Already running${NC}"
else
    cd driver-app && npm start > /tmp/driver.log 2>&1 &
    sleep 5
    if check_port 3000; then echo -e "${GREEN}OK${NC}"; else echo -e "${RED}FAILED${NC}"; fi
fi

# 4. Admin App
echo -n "[4/5] Starting Admin App (port 3001)... "
if check_port 3001; then
    echo -e "${GREEN}Already running${NC}"
else
    cd admin-app && npm start > /tmp/admin.log 2>&1 &
    sleep 5
    if check_port 3001; then echo -e "${GREEN}OK${NC}"; else echo -e "${RED}FAILED${NC}"; fi
fi

# 5. Landing Page
echo -n "[5/5] Starting Landing Page (port 3002)... "
if check_port 3002; then
    echo -e "${GREEN}Already running${NC}"
else
    cd landing && npm start > /tmp/landing.log 2>&1 &
    sleep 5
    if check_port 3002; then echo -e "${GREEN}OK${NC}"; else echo -e "${RED}FAILED${NC}"; fi
fi

echo ""
echo "============================="
echo "  All services:"
echo "  Landing   → http://localhost:3002"
echo "  Driver    → http://localhost:3000"
echo "  Admin     → http://localhost:3001"
echo "  Backend   → http://localhost:5001"
echo "  ML API    → http://localhost:5002"
echo "============================="
echo ""
echo "Login Credentials:"
echo "  Admin:  admin@example.com / admin123"
echo "  Driver: driver@example.com / driver123"
