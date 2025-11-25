API
===

## env vars

```yml
- APP_ENV: App enviroment
- MONGO_HOST: Mongo host (Mongo URL)
- ALLOWED_ORIGINS: CORS origin access (optional)
- API_KEY: API Key (optional)
```
# test

GET request example
```
curl -i http://{host}/test -H 'X-Api-Key: {api-key}'
```
