import hashlib

message = "Good morning, sir."

fingerprint = hashlib.sha256(message.encode("utf-8")).hexdigest()

print(fingerprint)
