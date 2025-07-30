FROM alpine:latest

WORKDIR /app


COPY . .
RUN apk add --no-cache iptables && chmod +x mem_check legacy backup entrypoint.sh

CMD ["sh", "./entrypoint.sh"]