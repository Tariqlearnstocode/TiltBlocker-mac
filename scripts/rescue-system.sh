#!/bin/bash

# Trader Browser Block - Emergency System Rescue
# This script restores your system's HOSTS file if the application was deleted
# while a lockout was active.

echo "🚑 Trader Browser Block - Emergency Rescue"
echo "=========================================="

HOSTS_FILE="/etc/hosts"
MARKER_START="# TRADER-BLOCK-START"
MARKER_END="# TRADER-BLOCK-END"

if [ "$(id -u)" -ne 0 ]; then
    echo "⚠️  Administrator privileges required to modify hosts file."
    echo "Please run with sudo: sudo ./rescue-system.sh"
    exit 1
fi

echo "🔍 Checking $HOSTS_FILE for blocking entries..."

if grep -q "$MARKER_START" "$HOSTS_FILE"; then
    echo "⚠️  Found active blocking entries."
    
    # Backup existing hosts file
    BACKUP_PATH="${HOSTS_FILE}.backup.$(date +%s)"
    cp "$HOSTS_FILE" "$BACKUP_PATH"
    echo "📄 Created backup at $BACKUP_PATH"
    
    # Create a temporary file
    TMP_FILE=$(mktemp)
    
    # Remove the block section
    # This sed command deletes lines from START to END marker inclusive
    sed "/$MARKER_START/,/$MARKER_END/d" "$HOSTS_FILE" > "$TMP_FILE"
    
    # Verify the temp file isn't empty (safety check)
    if [ -s "$TMP_FILE" ]; then
        cat "$TMP_FILE" > "$HOSTS_FILE"
        echo "✅ Blocking entries removed."
    else
        echo "❌ Error: Temporary file was empty. Aborting to prevent data loss."
        rm "$TMP_FILE"
        exit 1
    fi
    rm "$TMP_FILE"

    # Flush DNS Cache
    echo "🔄 Flushing DNS cache..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        dscacheutil -flushcache
        killall -HUP mDNSResponder
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
         # Try common linux DNS flush commands
         resolvectl flush-caches 2>/dev/null || \
         systemd-resolve --flush-caches 2>/dev/null || \
         service network-manager restart 2>/dev/null || \
         /etc/init.d/nscd restart 2>/dev/null
    fi
    
    echo "🎉 System restored! You should now have access to all websites."

else
    echo "✅ No active blocking entries found in $HOSTS_FILE."
fi

