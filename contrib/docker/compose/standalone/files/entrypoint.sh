#!/bin/sh
# Entrypoint script for DataGerry on Cloud Run.
#
# DataGerry reads its configuration exclusively from cmdb.conf — it does not
# support environment variables natively. To use the same image across
# environments (e.g. dev, qa, prod) without rebuilding, this script
# patches cmdb.conf at container startup using env vars injected by Cloud Run.
#
# Required env vars:
#   MONGODB_URI     — full MongoDB connection string (e.g. mongodb+srv://...)
#   DATABASE_NAME   — name of the MongoDB database (e.g. cmdb)
#
# When ENTRYPOINT and CMD are both set, Docker passes CMD as arguments to
# the entrypoint — it does not run CMD directly. The entrypoint patches
# cmdb.conf from env vars, then calls "exec $@" to hand off to CMD.

set -e

if [ -z "$MONGODB_URI" ]; then
    echo "ERROR: MONGODB_URI environment variable is not set." >&2
    exit 1
fi

if [ -z "$DATABASE_NAME" ]; then
    echo "ERROR: DATABASE_NAME environment variable is not set." >&2
    exit 1
fi

# & and \ are special characters in sed replacement strings — escape them first
ESCAPED_URI=$(printf '%s' "$MONGODB_URI" | sed 's/[&\]/\\&/g')

sed -i "s|^database_uri = .*|database_uri = ${ESCAPED_URI}|" /etc/datagerry/cmdb.conf
sed -i "s|^database_name = .*|database_name = ${DATABASE_NAME}|" /etc/datagerry/cmdb.conf

exec "$@"
