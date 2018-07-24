# catcat-firebase

Firebase related

## Preparation for local development

- create `serviceAccountKey.json` under `firebase`

```shell
> cd firebase/functions
> firebase functions:config:get > .runtimeconfig.json
```

## Develop

under `firebase/functions`

```shell
# Develop
npm run dev

# Local serve
npm run serve

# Deploy functions
npm run deploy
```