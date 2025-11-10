#!/bin/bash

###############################################################################
# Cron Job Configuration for AI Agent System
# Linux/Mac compatible cron schedules
###############################################################################

echo "AI Agent System - Cron Job Installation"
echo "========================================"
echo ""
echo "This script will install cron jobs for all AI agents."
echo "The following jobs will be scheduled:"
echo ""
echo "  • CEO Agent (Daily Briefing): Every day at 6:00 AM"
echo "  • Finance Agent: Every day at 6:00 AM"
echo "  • Sales Agent: Every day at 6:05 AM"
echo "  • Operations Agent: Every day at 6:10 AM"
echo "  • Marketing Agent: Every day at 6:15 AM"
echo "  • HR Agent: Every Monday at 6:20 AM"
echo "  • Customer Success Agent: Every day at 6:25 AM"
echo "  • Health Check: Every hour"
echo "  • Database Backup: Every day at 2:00 AM"
echo ""
echo "All logs will be saved to: /var/log/ai-agents/"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Get the project directory
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
LOG_DIR="/var/log/ai-agents"

echo ""
echo "Project directory: $PROJECT_DIR"
echo "Log directory: $LOG_DIR"
echo ""

# Create log directory
sudo mkdir -p "$LOG_DIR"
sudo chown $(whoami) "$LOG_DIR"

# Create cron jobs
CRON_FILE="/tmp/ai-agents-cron.txt"

cat > "$CRON_FILE" << EOF
# AI Agent System - Automated Cron Jobs
# Generated: $(date)

# CEO Agent - Daily briefing at 6:00 AM
0 6 * * * cd $PROJECT_DIR && node dist/agents/ceo/index.js >> $LOG_DIR/ceo-agent.log 2>&1

# Finance Agent - Daily at 6:00 AM
0 6 * * * cd $PROJECT_DIR && node dist/agents/finance/index.js >> $LOG_DIR/finance-agent.log 2>&1

# Sales Agent - Daily at 6:05 AM
5 6 * * * cd $PROJECT_DIR && node dist/agents/sales/index.js >> $LOG_DIR/sales-agent.log 2>&1

# Operations Agent - Daily at 6:10 AM
10 6 * * * cd $PROJECT_DIR && node dist/agents/operations/index.js >> $LOG_DIR/ops-agent.log 2>&1

# Marketing Agent - Daily at 6:15 AM
15 6 * * * cd $PROJECT_DIR && node dist/agents/marketing/index.js >> $LOG_DIR/marketing-agent.log 2>&1

# HR Agent - Weekly on Monday at 6:20 AM
20 6 * * 1 cd $PROJECT_DIR && node dist/agents/hr/index.js >> $LOG_DIR/hr-agent.log 2>&1

# Customer Success Agent - Daily at 6:25 AM
25 6 * * * cd $PROJECT_DIR && node dist/agents/customer-success/index.js >> $LOG_DIR/customer-success-agent.log 2>&1

# Health Check - Every hour
0 * * * * cd $PROJECT_DIR && node dist/scripts/monitoring/health-check.js >> $LOG_DIR/health-check.log 2>&1

# Database Backup - Daily at 2:00 AM
0 2 * * * cd $PROJECT_DIR && bash scripts/database/backup.sh >> $LOG_DIR/backup.log 2>&1

# Log Rotation - Every Sunday at midnight
0 0 * * 0 cd $LOG_DIR && find . -name "*.log" -mtime +30 -delete

EOF

# Install cron jobs
crontab "$CRON_FILE"

echo "✓ Cron jobs installed successfully!"
echo ""
echo "To view installed cron jobs:"
echo "  crontab -l"
echo ""
echo "To edit cron jobs:"
echo "  crontab -e"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/ceo-agent.log"
echo ""
echo "To test an agent manually:"
echo "  cd $PROJECT_DIR && node dist/agents/ceo/index.js"
echo ""

# Clean up
rm "$CRON_FILE"

echo "Installation complete!"
