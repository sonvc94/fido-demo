import boto3
import os
import json
from botocore.exceptions import ClientError

# Mock environment if needed, or rely on container envs
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_REGION = os.getenv("COGNITO_REGION", "ap-southeast-1")

print(f"Using Client ID: {COGNITO_CLIENT_ID}")
print(f"Using Region: {COGNITO_REGION}")

client = boto3.client('cognito-idp', region_name=COGNITO_REGION)

# User's payload from curl, but with transports added as empty list
payload = {
    "AccessToken": "eyJraWQiOiJwMTkwb0pNd1h1ZU9WNVFqbDRwdDV2dEJSdmNEejBUc0FJOGFObzBFdno4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxOWJhNjUxYy1jMDcxLTcwMWEtZGVjMi05YTE2ZmFlMDUyZDQiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfNzdlbWZwSUVpIiwiY2xpZW50X2lkIjoiMzcyczFpYXR1bmlkamUydmd2ODMxM2hnZW8iLCJvcmlnaW5fanRpIjoiNDQ5MWJhOGQtNGU3MC00YTczLWEzYjMtN2VhNGVkNjMyOTljIiwiZXZlbnRfaWQiOiI0NThiZjU5Ni01ZjkwLTQxM2UtOTgzZC1kMTRiNWE4NzhiOWQiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzY3ODAyOTQ3LCJleHAiOjE3Njc4MDY1NDcsImlhdCI6MTc2NzgwMjk0NywianRpIjoiM2I4NWE4YzAtYWMxZi00YWQ1LWJlODQtN2U3Yzg3NjNiOTkzIiwidXNlcm5hbWUiOiIxOWJhNjUxYy1jMDcxLTcwMWEtZGVjMi05YTE2ZmFlMDUyZDQifQ.yCx4eXHIVS6HOyBAFb_Ekc_n1V3LDi4rqNRWVaOedZpmq08uJ9ram-UvcrsIqPjZzpxVlmd_oAnD9n9w3jX8J0iF3X3BHuyI1y5pRTyPleDic6MEQfgFl2pdOTJ-QXIwsJi8KQoStaGFayXhPgbJjcWNegbtUDssc2E2O_n-H0rniJaEMluhx8p1hmrZ-9U4XEFuukYGTX7O_8qEAq4_IEIS_VxqITdvi69bV9R_zcNajPvjnelvbzUj5T6o6Wh7oAObHWvES8fHQElsqKDeDB9zQ5Cy6nhsRCeFau6drepsr1-791CwiuQHJpsLnusWe7SMriPU6wWqC62F1SJLng",
    "Credential": {
        "id": "WUj4E43M6tpJkzrSLgVoOk6K-dI",
        "rawId": "WUj4E43M6tpJkzrSLgVoOk6K-dI",
        "type": "public-key",
        "response": {
            "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWDZRX1pjdUowSENOb2pqWkt3cnItZyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3QiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ",
            "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NZAAAAAPv8MAcVTk7MjAtuAgVX170AFFlI-BONzOraSZM60i4FaDpOivnSpQECAyYgASFYIIlVwKldFgOYEkO4_7c8_kM-r3KUmZ9zUSrQtFIY0VdlIlggy8ecPTOPYo8iZR9M9cIId7agGwK59mrWN_WuKLjH7yk",
            "transports": [] 
        },
        "clientExtensionResults": {}
    }
}

print("\nSending payload to Cognito (with transports=[])...")
try:
    response = client.complete_web_authn_registration(**payload)
    print("SUCCESS!")
    print(json.dumps(response, indent=2, default=str))
except ClientError as e:
    print("ERROR!")
    print(f"Code: {e.response['Error']['Code']}")
    print(f"Message: {e.response['Error']['Message']}")
    print("\nFull Response:")
    print(json.dumps(e.response, indent=2, default=str))
except Exception as e:
    print(f"Unexpected Error: {e}")
