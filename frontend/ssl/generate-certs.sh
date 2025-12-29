#!/bin/bash
# Generate self-signed SSL certificate for development

cd "$(dirname "$0")"

if [ -f "cert.pem" ] && [ -f "key.pem" ]; then
    echo "Certificates already exist. Skipping generation."
    echo "To regenerate, delete cert.pem and key.pem first."
    exit 0
fi

echo "Generating self-signed SSL certificate..."

openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Certificate generated successfully!"
echo "cert.pem: $PWD/cert.pem"
echo "key.pem: $PWD/key.pem"
