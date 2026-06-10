FROM quay.io/centos/centos:stream9
LABEL maintainer="adnan.smajic@becon.de"

RUN yum install -y freetype fontconfig

# set locale
ARG build_locale=en_US

# install DATAGERRY
COPY files/DATAGERRY-*.rpm /tmp
RUN rpm -ivh /tmp/DATAGERRY-*.rpm \
    && yum -y install glibc-locale-source glibc-langpack-en \
    && localedef -c -i ${build_locale} -f UTF-8 ${build_locale}.utf-8

# set locale
ENV LANG=${build_locale}.utf8

RUN printf '[Database]\n\
host = 127.0.0.1\n\
port = 27017\n\
database_name = <REPLACED WITH DATABASE_NAME ENV VAR>\n\
database_uri = <REPLACED WITH MONGODB_URI ENV VAR>\n\
;username = username\n\
;password = password\n\
\n\
[WebServer]\n\
host = 0.0.0.0\n\
port = 4000\n\
\n\
[MessageQueueing]\n\
host = 127.0.0.1\n\
port = 5672\n\
username = guest\n\
password = guest\n\
exchange = datagerry.eventbus\n\
connection_attempts = 2\n\
retry_delay = 6\n\
use_tls = False\n' > /etc/datagerry/cmdb.conf

COPY files/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# Patches cmdb.conf from env vars before starting the app. See files/entrypoint.sh for details..
ENTRYPOINT ["/entrypoint.sh"]

CMD ["/usr/bin/datagerry", "-c", "/etc/datagerry/cmdb.conf", "-s"]
