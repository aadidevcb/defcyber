FROM alpine:latest

WORKDIR /app

# Install build tools and OpenSSL dev libraries
RUN apk add --no-cache g++ openssl-dev

COPY . .

# Compile binaries
RUN g++ -o mem_check memchecker.cpp -lssl -lcrypto \
    && g++ -o legacy legacy.cpp \
    && g++ -o backup backup.cpp \
    && g++ -o firewall firewall.cpp 

RUN apk add --no-cache iptables && chmod +x mem_check legacy backup entrypoint.sh && mkdir -p /app/backupdir

CMD ["sh", "./entrypoint.sh"]